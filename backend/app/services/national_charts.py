"""Anonymized chart series for national RSGI dashboard."""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.record import PatientRecord
from app.services.anonymization import assert_no_pii
from app.services.bd_geo import DIVISIONS, DIVISION_DISPLAY
from app.services.national_map import (
    BOUNDARY_DISTRICTS,
    _canonical_district,
    _normalized_risk_level,
    map_summary,
)


def division_prevalence_chart(db: Session) -> dict:
    summary = map_summary(db)
    by_division = {metric["id"]: metric for metric in summary["divisions"]}
    labels = [division["name"].removesuffix(" Division") for division in DIVISIONS]
    rates = [
        round(metric["high_risk_share"] * 100, 1)
        if (metric := by_division.get(division["id"])) and metric["status"] == "available"
        else None
        for division in DIVISIONS
    ]

    risk_counts = db.query(PatientRecord.risk_level, func.count(PatientRecord.id)).group_by(PatientRecord.risk_level).all()
    national_total = national_high = 0
    for risk, count in risk_counts:
        normalized_risk = _normalized_risk_level(risk)
        if normalized_risk:
            national_total += int(count)
            if normalized_risk == "high":
                national_high += int(count)
    national_benchmark = (
        round(100.0 * national_high / national_total, 1)
        if national_total >= settings.NATIONAL_MIN_CELL_SIZE
        else None
    )

    payload = {
        "labels": labels,
        "high_risk_share_percent": rates,
        "national_high_risk_share_percent": national_benchmark,
        "empty": all(r is None for r in rates) and national_benchmark is None,
    }
    assert_no_pii(payload)
    return payload


def demographics_chart(db: Session) -> dict:
    bands = [
        ("18-30", 18, 30),
        ("31-45", 31, 45),
        ("46-60", 46, 60),
        ("60+", 61, None),
    ]
    labels = [b[0] for b in bands]
    counts: dict[tuple[int, str], list[int]] = defaultdict(lambda: [0, 0])
    rows = (
        db.query(PatientRecord.age, PatientRecord.gender, PatientRecord.risk_level, func.count(PatientRecord.id))
        .group_by(PatientRecord.age, PatientRecord.gender, PatientRecord.risk_level)
        .all()
    )
    for age, gender, risk, raw_count in rows:
        risk = _normalized_risk_level(risk)
        gender = str(gender or "").strip().lower()
        gender = {"m": "male", "f": "female"}.get(gender, gender)
        if not risk or gender not in {"male", "female"}:
            continue
        band_index = next((i for i, (_, lo, hi) in enumerate(bands) if age >= lo and (hi is None or age <= hi)), None)
        if band_index is None:
            continue
        count = int(raw_count)
        bucket = counts[(band_index, gender)]
        bucket[0] += count
        if risk == "high":
            bucket[1] += count

    male_rates: list[float | None] = []
    female_rates: list[float | None] = []
    for band_index in range(len(bands)):
        for gender, values in (("male", male_rates), ("female", female_rates)):
            total, high = counts[(band_index, gender)]
            values.append(
                round(100.0 * high / total, 1)
                if total >= settings.NATIONAL_MIN_CELL_SIZE
                else None
            )

    payload = {
        "labels": labels,
        "male_high_risk_share_percent": male_rates,
        "female_high_risk_share_percent": female_rates,
        "empty": all(v is None for v in male_rates + female_rates),
    }
    assert_no_pii(payload)
    return payload


def spatial_panel(division_id: str, district_id: str | None, db: Session) -> dict:
    summary = map_summary(db)
    canonical_scope = _canonical_district(district_id) if district_id else None
    scoped_metrics = [
        metric for metric in summary["districts"]
        if BOUNDARY_DISTRICTS[metric["name"]] == division_id
        and (canonical_scope is None or metric["name"] == canonical_scope)
        and metric["status"] == "available"
    ]
    districts = [
        {
            "label": metric["name"],
            "rate": round(float(metric["high_risk_share"]) * 100, 1),
            "severity": (
                "critical" if metric["high_risk_share"] >= 0.4 else
                "elevated" if metric["high_risk_share"] >= 0.25 else
                "moderate" if metric["high_risk_share"] >= 0.1 else "low"
            ),
            "source": "database",
        }
        for metric in scoped_metrics
    ]

    raw_districts = db.query(PatientRecord.district).distinct().all()
    matching_raw_districts = [
        raw_name for (raw_name,) in raw_districts
        if (canonical := _canonical_district(raw_name))
        and BOUNDARY_DISTRICTS[canonical] == division_id
        and (canonical_scope is None or canonical == canonical_scope)
    ]
    scored_filter = func.lower(func.trim(PatientRecord.risk_level)).in_(
        ("low", "low risk", "moderate", "moderate risk", "medium", "medium risk", "high", "high risk")
    )
    scored_count, average_age = (
        db.query(func.count(PatientRecord.id), func.avg(PatientRecord.age))
        .filter(PatientRecord.district.in_(matching_raw_districts), scored_filter)
        .first()
        if matching_raw_districts else (0, None)
    )
    average_age = (
        round(float(average_age), 1)
        if scored_count >= settings.NATIONAL_MIN_CELL_SIZE and average_age is not None
        else None
    )

    year_counts: dict[int, list[int]] = defaultdict(lambda: [0, 0])
    if matching_raw_districts:
        year_rows = (
            db.query(
                PatientRecord.district,
                func.extract("year", PatientRecord.created_at),
                PatientRecord.risk_level,
                func.count(PatientRecord.id),
            )
            .filter(PatientRecord.district.in_(matching_raw_districts))
            .group_by(PatientRecord.district, func.extract("year", PatientRecord.created_at), PatientRecord.risk_level)
            .all()
        )
        for _, raw_year, raw_risk, raw_count in year_rows:
            risk = _normalized_risk_level(raw_risk)
            if not risk:
                continue
            year = int(raw_year)
            if year >= datetime.now(timezone.utc).year:
                continue
            count = int(raw_count)
            year_counts[year][0] += count
            if risk == "high":
                year_counts[year][1] += count

    annual_shares = [
        (year, high / total)
        for year, (total, high) in sorted(year_counts.items())
        if total >= settings.NATIONAL_MIN_CELL_SIZE
    ]
    share_change = (
        round((annual_shares[-1][1] - annual_shares[-2][1]) * 100, 1)
        if len(annual_shares) >= 2 and annual_shares[-1][0] == annual_shares[-2][0] + 1 else None
    )

    title = f"{DIVISION_DISPLAY.get(division_id, division_id)} District Record Summary"
    if district_id:
        title = f"{canonical_scope or district_id} District Record Summary"

    payload = {
        "title": title,
        "division_id": division_id,
        "district_id": district_id,
        "districts": districts,
        "metrics": {
            "high_risk_share_change_yoy_percentage_points": share_change,
            "mean_record_age_years": average_age,
            "screening_coverage_percent": None,
        },
        "metric_basis": "Aggregated from scored patient records stored in the database; unavailable fields are not collected.",
    }
    assert_no_pii(payload)
    return payload
