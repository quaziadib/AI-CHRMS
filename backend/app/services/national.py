"""National analytics helpers: resources, CSV export, orchestration."""

from __future__ import annotations

import csv
import io
import math
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.anonymization import (
    assert_no_pii,
    district_aggregates,
    public_district_summaries,
)
from app.services.population_forecast import get_latest_completed_population_forecast


def build_resource_estimates(db: Session) -> list[dict]:
    aggregates = district_aggregates(db)
    latest = get_latest_completed_population_forecast(db)
    forecast_by_district: dict[str, float] = {}
    if latest and latest.result and isinstance(latest.result.get("districts"), list):
        for row in latest.result["districts"]:
            district = row.get("district")
            # Prefer 12-month high-risk projection when present
            projected = row.get("high_risk_12m")
            if projected is None:
                projected = row.get("high_risk_6m")
            if district and projected is not None:
                forecast_by_district[district] = float(projected)

    resources: list[dict] = []
    for agg in aggregates:
        if agg.suppressed:
            resources.append(
                {
                    "district": agg.district,
                    "suppressed": True,
                    "projected_high_risk": None,
                    "testing_kits": None,
                    "medicine_packs": None,
                    "clinic_sites": None,
                    "source": "suppressed",
                }
            )
            continue

        if agg.district in forecast_by_district:
            projected = forecast_by_district[agg.district]
            source = "forecast"
        else:
            projected = float(agg.high_risk)
            source = "burden"

        kits = int(math.ceil(projected * settings.NATIONAL_KITS_PER_HIGH_RISK))
        meds = int(math.ceil(projected * settings.NATIONAL_MEDICINE_PACKS_PER_HIGH_RISK))
        capacity = max(settings.NATIONAL_CLINIC_CAPACITY_PER_SITE, 1)
        clinics = int(math.ceil(projected / capacity)) if projected > 0 else 0

        resources.append(
            {
                "district": agg.district,
                "suppressed": False,
                "projected_high_risk": round(projected, 2),
                "testing_kits": kits,
                "medicine_packs": meds,
                "clinic_sites": clinics,
                "source": source,
            }
        )

    assert_no_pii(resources)
    return resources


def district_summary_csv(db: Session) -> str:
    rows = public_district_summaries(db)
    assert_no_pii(rows)
    buffer = io.StringIO()
    fieldnames = [
        "district",
        "suppressed",
        "record_count",
        "low_risk",
        "moderate_risk",
        "high_risk",
        "unscored",
        "high_risk_rate",
        "latest_record_at",
    ]
    writer = csv.DictWriter(buffer, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    return buffer.getvalue()


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
