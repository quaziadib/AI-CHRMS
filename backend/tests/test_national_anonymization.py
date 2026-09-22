"""Unit tests for national anonymization and pattern sanitization."""

from __future__ import annotations

import pytest

from app.services.anonymization import (
    FORBIDDEN_FIELDS,
    DistrictAggregate,
    assert_no_pii,
)
from app.ai.pattern_discovery_chain import sanitize_aggregates_for_llm


def test_assert_no_pii_rejects_email():
    with pytest.raises(ValueError, match="email"):
        assert_no_pii([{"district": "Dhaka", "email": "a@b.com"}])


def test_assert_no_pii_rejects_user_id():
    with pytest.raises(ValueError, match="user_id"):
        assert_no_pii({"districts": [{"user_id": "abc", "district": "Dhaka"}]})


def test_assert_no_pii_allows_aggregates():
    assert_no_pii(
        [
            {
                "district": "Dhaka",
                "record_count": 10,
                "high_risk": 2,
                "suppressed": False,
            }
        ]
    )


def test_suppressed_public_dict_hides_counts():
    agg = DistrictAggregate(
        district="Tiny",
        record_count=2,
        low_risk=1,
        moderate_risk=1,
        high_risk=0,
        unscored=0,
        suppressed=True,
        high_risk_rate=None,
        latest_record_at=None,
    )
    public = agg.to_public_dict()
    assert public["suppressed"] is True
    assert public["record_count"] is None
    assert "email" not in public
    for key in FORBIDDEN_FIELDS:
        assert key not in public


def test_sanitize_aggregates_rejects_pii_keys():
    with pytest.raises(ValueError):
        sanitize_aggregates_for_llm([{"district": "Dhaka", "name": "Secret"}])


def test_sanitize_aggregates_keeps_allowlist():
    cleaned = sanitize_aggregates_for_llm(
        [
            {
                "district": "Dhaka",
                "suppressed": False,
                "record_count": 20,
                "low_risk": 5,
                "moderate_risk": 10,
                "high_risk": 5,
                "high_risk_rate": 0.25,
                "unscored": 0,
                "latest_record_at": "2026-01-01T00:00:00+00:00",
            }
        ]
    )
    assert cleaned[0]["district"] == "Dhaka"
    assert "latest_record_at" not in cleaned[0]
    assert_no_pii(cleaned)


def test_forecast_engine_flat_and_trend():
    from app.services.population_forecast_engine import forecast_district_series

    unavailable = forecast_district_series([])
    assert unavailable["status"] == "unavailable"

    flat = forecast_district_series(
        [{"month": "2026-01-01", "record_count": 10, "high_risk": 3}]
    )
    assert flat["model"] == "flat"
    assert flat["high_risk_6m"] == 3

    trend = forecast_district_series(
        [
            {"month": "2025-11-01", "record_count": 5, "high_risk": 1},
            {"month": "2025-12-01", "record_count": 8, "high_risk": 2},
            {"month": "2026-01-01", "record_count": 11, "high_risk": 3},
        ]
    )
    assert trend["status"] == "ok"
    assert trend["high_risk_12m"] is not None


def test_forecast_allowlist_excludes_suppressed_districts():
    """monthly_district_series must only keep districts that clear min cell size."""
    aggs = [
        DistrictAggregate(
            district="Tiny",
            record_count=2,
            low_risk=1,
            moderate_risk=1,
            high_risk=0,
            unscored=0,
            suppressed=True,
            high_risk_rate=None,
            latest_record_at=None,
        ),
        DistrictAggregate(
            district="Dhaka",
            record_count=20,
            low_risk=5,
            moderate_risk=10,
            high_risk=5,
            unscored=0,
            suppressed=False,
            high_risk_rate=0.25,
            latest_record_at=None,
        ),
    ]
    allowed = {a.district for a in aggs if not a.suppressed}
    raw_series = {
        "Tiny": [{"month": "2026-01-01", "record_count": 2, "high_risk": 1}],
        "Dhaka": [{"month": "2026-01-01", "record_count": 10, "high_risk": 3}],
    }
    filtered = {k: v for k, v in raw_series.items() if k in allowed}
    assert "Tiny" not in filtered
    assert "Dhaka" in filtered
    assert_no_pii(filtered)
