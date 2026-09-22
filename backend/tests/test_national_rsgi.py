"""Tests for national RSGI geo, charts, and predictor guards."""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.api.deps import get_national_admin_user
from app.services.bd_geo import (
    division_for_district,
    list_districts,
    list_divisions,
    list_thanas,
    list_upazillas,
)
from app.ai.individual_predictor_chain import build_predictor_prompt_vars
from app.services.anonymization import assert_no_pii


def test_geo_cascade_dhaka_and_chittagong():
    divs = list_divisions()
    assert any(d["id"] == "dhaka" for d in divs)
    dhaka_districts = list_districts("dhaka")
    assert any(d["id"] == "Dhaka" for d in dhaka_districts)
    upas = list_upazillas("Dhaka")
    assert len(upas) >= 1
    thanas = list_thanas(upas[0]["id"])
    assert len(thanas) >= 1

    ctg = list_districts("chittagong")
    assert any("Chittagong" in d["name"] or d["id"] == "Chittagong" for d in ctg)


def test_unknown_district_maps_to_other():
    assert division_for_district("CompletelyUnknownPlace") == "other"
    assert division_for_district("Dhaka") == "dhaka"


def test_predictor_prompt_allowlist_only():
    vars_ = build_predictor_prompt_vars(45, "female", 27.4, 118, "yes", "low")
    assert set(vars_.keys()) == {"age", "gender", "bmi", "glucose", "family_history", "activity"}
    assert "email" not in vars_
    assert "user_id" not in vars_


def test_chart_payload_rejects_pii():
    with pytest.raises(ValueError):
        assert_no_pii({"labels": ["Dhaka"], "email": "x@y.com"})


class _User:
    def __init__(self, roles):
        self.roles = roles
        self.id = "u1"


def test_predictor_auth_patient_forbidden():
    with pytest.raises(HTTPException) as exc:
        get_national_admin_user(_User(["patient"]))  # type: ignore[arg-type]
    assert exc.value.status_code == 403


def test_epidemic_forecast_schema_accepts_compact_payload():
    from app.ai.epidemic_forecast_chain import EpidemicForecastResult

    sample = EpidemicForecastResult(
        series=[
            {"year": 2024, "urban_prevalence_percent": 18, "rural_prevalence_percent": 9},
            {"year": 2026, "urban_prevalence_percent": 20, "rural_prevalence_percent": 10},
            {"year": 2028, "urban_prevalence_percent": 22, "rural_prevalence_percent": 11},
            {"year": 2030, "urban_prevalence_percent": 24, "rural_prevalence_percent": 13},
            {"year": 2032, "urban_prevalence_percent": 27, "rural_prevalence_percent": 14},
            {"year": 2034, "urban_prevalence_percent": 29, "rural_prevalence_percent": 15},
        ],
        risk_groups=[
            {"key": "low", "label": "Low", "population_share_percent": 40, "guidance": "screen"},
            {"key": "prediabetes", "label": "Prediabetes", "population_share_percent": 35, "guidance": "diet"},
            {"key": "high", "label": "High", "population_share_percent": 25, "guidance": "treat"},
        ],
        summary="Illustrative",
    )
    assert len(sample.series) == 6
    assert len(sample.risk_groups) == 3
