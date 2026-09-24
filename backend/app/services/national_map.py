"""Suppression-aware map aggregates keyed to bundled geoBoundaries identifiers."""

from __future__ import annotations

import re
from collections import defaultdict
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.record import PatientRecord
from app.services.bd_geo import DIVISION_DISPLAY


BOUNDARY_DISTRICTS: dict[str, str] = {
    "Barguna": "barisal", "Barisal": "barisal", "Bhola": "barisal", "Jhalokati": "barisal",
    "Patuakhali": "barisal", "Pirojpur": "barisal", "Bandarban": "chittagong",
    "Brahamanbaria": "chittagong", "Chandpur": "chittagong", "Chittagong": "chittagong",
    "Comilla": "chittagong", "Cox's Bazar": "chittagong", "Feni": "chittagong",
    "Khagrachhari": "chittagong", "Lakshmipur": "chittagong", "Noakhali": "chittagong",
    "Rangamati": "chittagong", "Dhaka": "dhaka", "Faridpur": "dhaka", "Gazipur": "dhaka",
    "Gopalganj": "dhaka", "Kishoreganj": "dhaka", "Madaripur": "dhaka", "Manikganj": "dhaka",
    "Munshiganj": "dhaka", "Narayanganj": "dhaka", "Narsingdi": "dhaka", "Rajbari": "dhaka",
    "Shariatpur": "dhaka", "Tangail": "dhaka", "Bagerhat": "khulna", "Chuadanga": "khulna",
    "Jessore": "khulna", "Jhenaidah": "khulna", "Khulna": "khulna", "Kushtia": "khulna",
    "Magura": "khulna", "Meherpur": "khulna", "Narail": "khulna", "Satkhira": "khulna",
    "Jamalpur": "mymensingh", "Mymensingh": "mymensingh", "Netrakona": "mymensingh",
    "Sherpur": "mymensingh", "Bogra": "rajshahi", "Joypurhat": "rajshahi", "Naogaon": "rajshahi",
    "Natore": "rajshahi", "Nawabganj": "rajshahi", "Pabna": "rajshahi", "Rajshahi": "rajshahi",
    "Sirajganj": "rajshahi", "Dinajpur": "rangpur", "Gaibandha": "rangpur", "Kurigram": "rangpur",
    "Lalmonirhat": "rangpur", "Nilphamari": "rangpur", "Panchagarh": "rangpur", "Rangpur": "rangpur",
    "Thakurgaon": "rangpur", "Habiganj": "sylhet", "Maulvibazar": "sylhet", "Sunamganj": "sylhet",
    "Sylhet": "sylhet",
}

_ALIASES = {
    "chattogram": "chittagong", "cumilla": "comilla", "brahmanbaria": "brahamanbaria",
    "bogura": "bogra", "chapainawabganj": "nawabganj", "jashore": "jessore",
    "barishal": "barisal",
}


def _normalized_name(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())


_BY_NORMALIZED = {_normalized_name(name): name for name in BOUNDARY_DISTRICTS}
_BY_NORMALIZED.update({
    _normalized_name(alias): _BY_NORMALIZED[_normalized_name(target)]
    for alias, target in _ALIASES.items()
})


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _canonical_district(name: str | None) -> str | None:
    if not name:
        return None
    normalized = _normalized_name(name)
    for suffix in ("district", "zila", "zilla"):
        if normalized.endswith(suffix):
            normalized = normalized[: -len(suffix)]
            break
    return _BY_NORMALIZED.get(normalized)


def division_options(db: Session) -> list[dict[str, str]]:
    """Return only divisions represented by mapped records currently in the database."""
    districts = db.query(PatientRecord.district).distinct().all()
    represented = {
        BOUNDARY_DISTRICTS[canonical]
        for (raw_name,) in districts
        if (canonical := _canonical_district(raw_name))
    }
    return [
        {"id": division_id, "name": DIVISION_DISPLAY[division_id]}
        for division_id in DIVISION_DISPLAY
        if division_id != "other" and division_id in represented
    ]


def district_options(db: Session, division_id: str) -> list[dict[str, str]]:
    """Return canonical districts for the selected division that have stored records."""
    districts = db.query(PatientRecord.district).distinct().all()
    represented = {
        canonical
        for (raw_name,) in districts
        if (canonical := _canonical_district(raw_name))
        and BOUNDARY_DISTRICTS[canonical] == division_id
    }
    return [{"id": name, "name": name} for name in sorted(represented)]


def _normalized_risk_level(value: str | None) -> str | None:
    if not value:
        return None
    normalized = value.strip().lower().replace("_", " ").replace("-", " ")
    normalized = " ".join(normalized.split())
    return {
        "low": "low",
        "low risk": "low",
        "moderate": "moderate",
        "moderate risk": "moderate",
        "medium": "moderate",
        "medium risk": "moderate",
        "high": "high",
        "high risk": "high",
    }.get(normalized)


def _empty_metric(geo_id: str, name: str) -> dict:
    return {"id": geo_id, "name": name, "status": "unavailable", "high_risk_share": None}


def map_summary(db: Session) -> dict:
    """Return suppression-safe risk shares and signal cohorts awaiting risk scoring."""
    rows = (
        db.query(PatientRecord.district, PatientRecord.risk_level, func.count(PatientRecord.id))
        .group_by(PatientRecord.district, PatientRecord.risk_level)
        .all()
    )
    district_counts: dict[str, list[int]] = defaultdict(lambda: [0, 0, 0])
    division_counts: dict[str, list[int]] = defaultdict(lambda: [0, 0, 0])
    for raw_name, risk, count in rows:
        name = _canonical_district(raw_name)
        if not name:
            continue
        count = int(count)
        division_id = BOUNDARY_DISTRICTS[name]
        district_counts[name][0] += count
        division_counts[division_id][0] += count
        normalized_risk = _normalized_risk_level(risk)
        if normalized_risk:
            district_counts[name][1] += count
            division_counts[division_id][1] += count
            if normalized_risk == "high":
                district_counts[name][2] += count
                division_counts[division_id][2] += count

    threshold = settings.NATIONAL_MIN_CELL_SIZE

    def metric(geo_id: str, name: str, counts: list[int]) -> dict:
        total, scored, high = counts
        if total == 0:
            return _empty_metric(geo_id, name)
        if total < threshold:
            return {**_empty_metric(geo_id, name), "status": "suppressed"}
        if scored < threshold:
            return {**_empty_metric(geo_id, name), "status": "awaiting_scores"}
        return {"id": geo_id, "name": name, "status": "available", "high_risk_share": round(high / scored, 4)}

    divisions = [
        metric(_slug(name), name, division_counts.get(division_id, [0, 0, 0]))
        for division_id, name in ((item, DIVISION_DISPLAY[item].removesuffix(" Division")) for item in DIVISION_DISPLAY if item != "other")
    ]
    districts = [
        metric(_slug(name), name, district_counts.get(name, [0, 0, 0]))
        for name in BOUNDARY_DISTRICTS
    ]
    return {
        "generated_at": _utc_now_iso(),
        "metric_basis": "high-risk share among scored submitted health records; sufficiently large unscored cohorts are marked awaiting scores",
        "minimum_cell_size": threshold,
        "attribution": (
            "Division boundaries: geoBoundaries, BGD-ADM1-32408957 (CC0 1.0); "
            "district boundaries: geoBoundaries, BGD-ADM2-16705992, sourced from BBS/OCHA ROAP (CC BY 3.0 IGO)."
        ),
        "divisions": divisions,
        "districts": districts,
    }


def annual_division_observations(db: Session, scope_id: str) -> dict[str, list[dict[str, int | float]]]:
    """Build source-backed annual scored-record shares; omit suppressed years."""
    rows = (
        db.query(
            PatientRecord.district,
            func.extract("year", PatientRecord.created_at).label("year"),
            PatientRecord.risk_level,
            func.count(PatientRecord.id),
        )
        .filter(PatientRecord.risk_level.in_(("low", "moderate", "high")))
        .group_by(PatientRecord.district, func.extract("year", PatientRecord.created_at), PatientRecord.risk_level)
        .all()
    )
    scoped = DIVISION_DISPLAY.keys() if scope_id == "all" else (scope_id,)
    counts: dict[str, dict[int, list[int]]] = {division: defaultdict(lambda: [0, 0]) for division in scoped}
    for raw_name, raw_year, risk, raw_count in rows:
        district = _canonical_district(raw_name)
        if not district:
            continue
        division_id = BOUNDARY_DISTRICTS[district]
        if division_id not in counts:
            continue
        year = int(raw_year)
        total, high = counts[division_id][year]
        count = int(raw_count)
        counts[division_id][year] = [total + count, high + (count if risk == "high" else 0)]

    threshold = settings.NATIONAL_MIN_CELL_SIZE
    current_year = datetime.now(timezone.utc).year
    return {
        division: [
            {"year": year, "high_risk_share": round(high / total, 4)}
            for year, (total, high) in sorted(years.items())
            if total >= threshold and year < current_year
        ]
        for division, years in counts.items()
    }
