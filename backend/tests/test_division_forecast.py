"""Focused route, job, task, and output-schema coverage for division forecasts."""

from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.ai.division_forecast_chain import (
    DivisionForecastOutput,
    DivisionProjection,
    ProjectedPoint,
)
from app.api.v1 import national
from app.services import population_forecast
from app.tasks import epidemic_forecast


class _User:
    id = "admin-id"


def test_division_forecast_route_checks_feature_flag_and_scope(monkeypatch):
    monkeypatch.setattr(national.settings, "ENABLE_NATIONAL_ANALYTICS", True)
    monkeypatch.setattr(national.settings, "ENABLE_POPULATION_FORECASTING", False)
    with pytest.raises(HTTPException) as disabled:
        national.enqueue_division_forecast(national.DivisionForecastRequest(scope_id="dhaka"), _User(), object())
    assert disabled.value.status_code == 503

    monkeypatch.setattr(national.settings, "ENABLE_POPULATION_FORECASTING", True)
    monkeypatch.setattr(national.pop_forecast_service, "enqueue_division_forecast", lambda *_: pytest.fail("must reject invalid scope"))
    with pytest.raises(HTTPException) as unknown:
        national.enqueue_division_forecast(national.DivisionForecastRequest(scope_id="unknown"), _User(), object())
    assert unknown.value.status_code == 422


class _JobsQuery:
    def __init__(self, jobs):
        self.jobs = jobs

    def filter(self, *_args):
        return self

    def order_by(self, *_args):
        return self

    def first(self):
        return self.jobs[0] if self.jobs else None


class _JobsDb:
    def __init__(self, jobs):
        self.jobs = jobs

    def query(self, *_columns):
        return _JobsQuery(self.jobs)


def test_latest_division_forecast_returns_first_matching_row():
    latest_matching = SimpleNamespace(result={"forecast_kind": "division_epidemic_llm", "scope_id": "dhaka"})
    older_matching = SimpleNamespace(result={"forecast_kind": "division_epidemic_llm", "scope_id": "dhaka"})

    result = population_forecast.get_latest_division_forecast(
        _JobsDb([latest_matching, older_matching]), "dhaka"
    )

    assert result is latest_matching
    assert population_forecast.get_latest_division_forecast(_JobsDb([]), "dhaka") is None


def test_latest_lookups_filter_in_sql_not_by_recent_window():
    """Regression: kind/scope filters must be applied before ordering so older matching
    jobs are not lost after many unrelated forecast rows accumulate."""
    captured: dict[str, object] = {}

    class _CaptureQuery:
        def filter(self, *args):
            captured.setdefault("filters", []).extend(args)
            return self

        def order_by(self, *args):
            captured["order_by"] = args
            return self

        def first(self):
            captured["used_first"] = True
            return "job"

        def all(self):
            raise AssertionError("lookups must not load a recent-window batch with .all()")

        def limit(self, _count):
            raise AssertionError("lookups must not use a fixed recent-job scan limit")

    class _CaptureDb:
        def query(self, model):
            captured["model"] = model
            return _CaptureQuery()

    db = _CaptureDb()
    assert population_forecast.get_latest_division_forecast(db, "dhaka") == "job"
    assert captured["used_first"] is True
    assert len(captured["filters"]) >= 2

    captured.clear()
    assert population_forecast.get_latest_population_forecast(db) == "job"
    assert captured["used_first"] is True
    assert len(captured["filters"]) >= 1

    captured.clear()
    assert population_forecast.get_latest_completed_population_forecast(db) == "job"
    assert captured["used_first"] is True
    assert len(captured["filters"]) >= 2

    captured.clear()
    assert population_forecast.get_latest_epidemic_forecast(db) == "job"
    assert captured["used_first"] is True
    assert len(captured["filters"]) >= 1


class _TaskQuery:
    def __init__(self, job):
        self.job = job

    def filter(self, *_args):
        return self

    def first(self):
        return self.job


class _TaskDb:
    def __init__(self, job):
        self.job = job

    def query(self, *_columns):
        return _TaskQuery(self.job)

    def commit(self):
        pass

    def close(self):
        pass


def test_division_forecast_task_filters_projection_years_and_leaves_gaps_unavailable(monkeypatch):
    now_year = datetime.now(timezone.utc).year
    job = SimpleNamespace(status="pending", result={"scope_id": "dhaka"}, completed_at=None)
    db = _TaskDb(job)
    forecast_input = {}
    monkeypatch.setattr(epidemic_forecast, "SessionLocal", lambda: db)
    monkeypatch.setattr(
        epidemic_forecast.national_map,
        "annual_division_observations",
        lambda *_: {
            "dhaka": [
                {"year": 2020, "high_risk_share": 0.1},
                {"year": 2022, "high_risk_share": 0.2},
                {"year": now_year, "high_risk_share": 0.3},
                {"year": now_year + 1, "high_risk_share": 0.99},
            ]
        },
    )
    future_year = now_year + 1
    monkeypatch.setattr(
        epidemic_forecast,
        "run_division_forecast",
        lambda payload: (
            forecast_input.update(payload)
            or SimpleNamespace(
                projections=[
                    SimpleNamespace(
                        division_id="dhaka",
                        points=[
                            SimpleNamespace(year=now_year, high_risk_share=0.99),  # historical projection rejected
                            SimpleNamespace(year=future_year, high_risk_share=0.4),
                        ],
                    ),
                    SimpleNamespace(
                        division_id="rajshahi",
                        points=[SimpleNamespace(year=future_year, high_risk_share=0.8)],
                    ),
                ],
                summary="Scenario",
            )
        ),
    )

    epidemic_forecast.run_division_epidemic_forecast_job("job-id", "dhaka")

    assert job.status == "completed"
    assert [point["year"] for point in forecast_input["divisions"][0]["observations"]] == [2022, now_year]
    series = job.result["series"]
    assert [item["id"] for item in series] == ["dhaka"]
    points = {item["year"]: item for item in series[0]["points"]}
    assert points[2022] == {
        "year": 2022,
        "value": 0.2,
        "kind": "observed",
        "source": "scored submitted health records",
    }
    assert points[now_year]["kind"] == "observed"
    assert points[future_year]["kind"] == "projected"
    assert points[future_year]["value"] == 0.4
    assert points[future_year + 1]["kind"] == "unavailable"


def test_division_forecast_structured_output_enforces_year_share_and_point_bounds():
    valid = DivisionForecastOutput(
        projections=[
            DivisionProjection(
                division_id="dhaka",
                points=[ProjectedPoint(year=2035, high_risk_share=0.45)],
            )
        ],
        summary="Cautious scenario",
    )
    assert valid.projections[0].points[0].high_risk_share == 0.45

    with pytest.raises(ValidationError):
        ProjectedPoint(year=2036, high_risk_share=0.45)
    with pytest.raises(ValidationError):
        ProjectedPoint(year=2035, high_risk_share=1.1)
    with pytest.raises(ValidationError):
        DivisionProjection(division_id="dhaka", points=[])
