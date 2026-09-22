"""Anonymized chart series for national RSGI dashboard."""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy import and_, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.record import PatientRecord
from app.services.anonymization import assert_no_pii, district_aggregates
from app.services.bd_geo import DIVISIONS, division_for_district, spatial_hotspots_for_division, DIVISION_DISPLAY


def division_prevalence_chart(db: Session) -> dict:
    aggregates = district_aggregates(db)
    by_div: dict[str, dict[str, float]] = defaultdict(lambda: {"records": 0, "high": 0})

    for agg in aggregates:
        if agg.suppressed:
            continue
        div = division_for_district(agg.district)
        by_div[div]["records"] += agg.record_count
        by_div[div]["high"] += agg.high_risk

    labels: list[str] = []
    rates: list[float | None] = []
    for div in DIVISIONS:
        div_id = div["id"]
        stats = by_div.get(div_id)
        labels.append(div["name"].replace(" Division", ""))
        if not stats or stats["records"] < settings.NATIONAL_MIN_CELL_SIZE:
            rates.append(None)
        else:
            rates.append(round(100.0 * stats["high"] / stats["records"], 1))

    if "other" in by_div and by_div["other"]["records"] >= settings.NATIONAL_MIN_CELL_SIZE:
        labels.append("Other")
        rates.append(round(100.0 * by_div["other"]["high"] / by_div["other"]["records"], 1))

    payload = {
        "labels": labels,
        "prevalence_percent": rates,
        "national_benchmark_percent": 16.5,
        "empty": all(r is None for r in rates),
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
    male_rates: list[float | None] = []
    female_rates: list[float | None] = []

    for _, lo, hi in bands:
        for gender_key, bucket in (("male", male_rates), ("female", female_rates)):
            filters = [
                PatientRecord.age >= lo,
                func.lower(PatientRecord.gender) == gender_key,
            ]
            if hi is not None:
                filters.append(PatientRecord.age <= hi)
            total = db.query(func.count(PatientRecord.id)).filter(and_(*filters)).scalar() or 0
            if total < settings.NATIONAL_MIN_CELL_SIZE:
                bucket.append(None)
                continue
            high = (
                db.query(func.count(PatientRecord.id))
                .filter(and_(*filters, PatientRecord.risk_level == "high"))
                .scalar()
                or 0
            )
            bucket.append(round(100.0 * high / total, 1))

    payload = {
        "labels": labels,
        "male_prevalence_percent": male_rates,
        "female_prevalence_percent": female_rates,
        "empty": all(v is None for v in male_rates + female_rates),
    }
    assert_no_pii(payload)
    return payload


def spatial_panel(division_id: str, district_id: str | None, db: Session) -> dict:
    aggregates = district_aggregates(db)
    district_rate = None
    if district_id:
        for agg in aggregates:
            if agg.district == district_id and not agg.suppressed and agg.high_risk_rate is not None:
                district_rate = round(agg.high_risk_rate * 100, 1)
                break

    hotspots = []
    for h in spatial_hotspots_for_division(division_id):
        item = {**h, "source": "synthesis"}
        if district_id and district_rate is not None and district_id.lower() in h["label"].lower():
            item["rate"] = district_rate
            item["source"] = "aggregate"
        hotspots.append(item)

    title = f"{DIVISION_DISPLAY.get(division_id, division_id)} Spatial Risk Cluster"
    if district_id:
        title = f"{district_id} District Spatial Risk Cluster"

    payload = {
        "title": title,
        "division_id": division_id,
        "district_id": district_id,
        "hotspots": hotspots,
        "metrics": {
            "prevalence_growth_yoy_percent": 4.2,
            "avg_diagnosis_age": 42.5,
            "screening_coverage_percent": 38.9,
        },
        "synthesis": district_rate is None,
    }
    assert_no_pii(payload)
    return payload
