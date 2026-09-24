"""Regression coverage for database-backed national map aggregates."""

from __future__ import annotations

from datetime import datetime, timezone

from app.services import national_charts, national_map


class _Query:
    def __init__(self, rows):
        self.rows = rows

    def filter(self, *_args, **_kwargs):
        return self

    def group_by(self, *_args, **_kwargs):
        return self

    def all(self):
        return self.rows


class _Db:
    def __init__(self, rows):
        self.rows = rows

    def query(self, *_columns):
        return _Query(self.rows)


def test_map_summary_normalizes_aliases_and_suppresses_small_or_unscored_cells(monkeypatch):
    monkeypatch.setattr(national_map.settings, "NATIONAL_MIN_CELL_SIZE", 5)
    db = _Db(
        [
            ("Dhaka", "high", 3),
            ("Dhaka", "low", 2),
            ("Gazipur", "high", 1),
            ("Gazipur", "low", 1),
            ("Cumilla", "moderate", 5),
            ("Rajshahi", None, 5),
            ("not a Bangladesh district", "high", 20),
        ]
    )

    summary = national_map.map_summary(db)
    divisions = {item["id"]: item for item in summary["divisions"]}
    districts = {item["name"]: item for item in summary["districts"]}

    assert divisions["dhaka"] == {
        "id": "dhaka",
        "name": "Dhaka",
        "status": "available",
        "high_risk_share": 0.5714,
    }
    assert districts["Dhaka"]["status"] == "available"
    assert districts["Dhaka"]["high_risk_share"] == 0.6
    assert districts["Gazipur"]["status"] == "suppressed"
    assert districts["Comilla"]["status"] == "available"
    assert divisions["rajshahi"]["status"] == "awaiting_scores"
    assert divisions["rajshahi"]["high_risk_share"] is None
    assert all(item["name"] != "not a Bangladesh district" for item in summary["districts"])


def test_annual_observations_omit_below_threshold_and_future_years(monkeypatch):
    monkeypatch.setattr(national_map.settings, "NATIONAL_MIN_CELL_SIZE", 5)
    current_year = datetime.now(timezone.utc).year
    rows = [
        ("Cumilla", 2024, "high", 2),
        ("Cumilla", 2024, "low", 2),
        ("Cumilla", 2025, "high", 3),
        ("Cumilla", 2025, "moderate", 2),
        ("Cumilla", current_year, "high", 20),
        ("Cumilla", current_year + 1, "high", 20),
    ]

    observations = national_map.annual_division_observations(_Db(rows), "chittagong")

    assert observations == {
        "chittagong": [{"year": 2025, "high_risk_share": 0.6}]
    }


class _SpatialQuery:
    def __init__(self, rows, first=None):
        self.rows = rows
        self.first_result = first

    def distinct(self):
        return self

    def filter(self, *_args, **_kwargs):
        return self

    def group_by(self, *_args, **_kwargs):
        return self

    def all(self):
        return self.rows

    def first(self):
        return self.first_result


class _SpatialDb:
    def __init__(self, year_rows):
        self.year_rows = year_rows
        self.calls = 0

    def query(self, *_columns):
        self.calls += 1
        if self.calls == 1:
            return _SpatialQuery([("Dhaka",)])
        if self.calls == 2:
            return _SpatialQuery([], first=(10, 40.0))
        return _SpatialQuery(self.year_rows)


def test_spatial_yoy_change_excludes_in_progress_year(monkeypatch):
    monkeypatch.setattr(national_map.settings, "NATIONAL_MIN_CELL_SIZE", 5)
    monkeypatch.setattr(
        national_charts,
        "map_summary",
        lambda _db: {
            "districts": [
                {"name": "Dhaka", "status": "available", "high_risk_share": 0.5}
            ]
        },
    )
    current_year = datetime.now(timezone.utc).year
    db = _SpatialDb([
        ("Dhaka", 2024, "low", 8),
        ("Dhaka", 2024, "high", 2),
        ("Dhaka", 2025, "low", 2),
        ("Dhaka", 2025, "high", 8),
        ("Dhaka", current_year, "low", 1),
        ("Dhaka", current_year, "high", 9),
    ])

    result = national_charts.spatial_panel("dhaka", None, db)

    assert result["metrics"]["high_risk_share_change_yoy_percentage_points"] == 60.0
