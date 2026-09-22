"""Anonymized district aggregation for national analytics.

Only allowlisted aggregate fields leave this module — never name, email, or user_id.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime, timezone

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.record import PatientRecord

# Columns / keys that must never appear in national payloads
FORBIDDEN_FIELDS = frozenset(
    {
        "name",
        "full_name",
        "email",
        "user_id",
        "phone",
        "pid",
        "id",
        "doctor_id",
        "allergies",
        "symptoms",
        "diagnosis",
        "risk_explanation",
        "ehr_summary",
    }
)


@dataclass(frozen=True)
class DistrictAggregate:
    district: str
    record_count: int
    low_risk: int
    moderate_risk: int
    high_risk: int
    unscored: int
    suppressed: bool
    high_risk_rate: float | None
    latest_record_at: str | None

    def to_public_dict(self) -> dict:
        if self.suppressed:
            return {
                "district": self.district,
                "suppressed": True,
                "record_count": None,
                "low_risk": None,
                "moderate_risk": None,
                "high_risk": None,
                "unscored": None,
                "high_risk_rate": None,
                "latest_record_at": None,
            }
        return asdict(self)


def assert_no_pii(payload: dict | list) -> None:
    """Raise ValueError if forbidden keys appear anywhere in a nested payload."""

    def _walk(obj: object) -> None:
        if isinstance(obj, dict):
            for key, value in obj.items():
                if key in FORBIDDEN_FIELDS:
                    raise ValueError(f"Forbidden PII field in national payload: {key}")
                _walk(value)
        elif isinstance(obj, list):
            for item in obj:
                _walk(item)

    _walk(payload)


def district_aggregates(db: Session, min_cell_size: int | None = None) -> list[DistrictAggregate]:
    """GROUP BY district over patient_records using allowlisted columns only."""
    threshold = min_cell_size if min_cell_size is not None else settings.NATIONAL_MIN_CELL_SIZE

    districts = (
        db.query(
            PatientRecord.district,
            func.count(PatientRecord.id),
            func.max(PatientRecord.created_at),
        )
        .group_by(PatientRecord.district)
        .all()
    )

    results: list[DistrictAggregate] = []
    for district, count, latest in districts:
        risk_rows = (
            db.query(PatientRecord.risk_level, func.count(PatientRecord.id))
            .filter(PatientRecord.district == district)
            .group_by(PatientRecord.risk_level)
            .all()
        )
        low = moderate = high = unscored = 0
        for level, n in risk_rows:
            n = int(n)
            if level == "low":
                low = n
            elif level == "moderate":
                moderate = n
            elif level == "high":
                high = n
            else:
                unscored += n

        total = int(count)
        suppressed = total < threshold
        rate = round(high / total, 4) if total and not suppressed else None
        latest_iso = None
        if latest is not None and not suppressed:
            if isinstance(latest, datetime):
                latest_iso = (
                    latest.astimezone(timezone.utc).isoformat()
                    if latest.tzinfo
                    else latest.isoformat()
                )
            else:
                latest_iso = str(latest)

        results.append(
            DistrictAggregate(
                district=district or "Unknown",
                record_count=total,
                low_risk=low,
                moderate_risk=moderate,
                high_risk=high,
                unscored=unscored,
                suppressed=suppressed,
                high_risk_rate=rate,
                latest_record_at=latest_iso,
            )
        )

    results.sort(key=lambda d: d.district)
    return results


def monthly_district_series(db: Session) -> dict[str, list[dict]]:
    """Anonymized monthly high-risk + record counts per district for forecasting.

    Districts below NATIONAL_MIN_CELL_SIZE are omitted entirely so sparse
    cohorts never leak exact monthly counts into forecast job results.
    """
    allowed = {
        agg.district for agg in district_aggregates(db) if not agg.suppressed
    }

    month_col = func.date_trunc("month", PatientRecord.created_at).label("month")
    rows = (
        db.query(
            PatientRecord.district,
            month_col,
            func.count(PatientRecord.id).label("record_count"),
            func.sum(case((PatientRecord.risk_level == "high", 1), else_=0)).label("high_risk"),
        )
        .group_by(PatientRecord.district, month_col)
        .order_by(PatientRecord.district, month_col)
        .all()
    )

    series: dict[str, list[dict]] = {}
    for district, month, record_count, high_risk in rows:
        key = district or "Unknown"
        if key not in allowed:
            continue
        series.setdefault(key, []).append(
            {
                "month": month.date().isoformat() if hasattr(month, "date") else str(month)[:10],
                "record_count": int(record_count),
                "high_risk": int(high_risk or 0),
            }
        )
    return series


def public_district_summaries(db: Session) -> list[dict]:
    aggregates = district_aggregates(db)
    payload = [a.to_public_dict() for a in aggregates]
    assert_no_pii(payload)
    return payload
