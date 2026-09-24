import logging
from datetime import datetime, timezone

from app.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.population_forecast import PopulationForecastJob
from app.ai.epidemic_forecast_chain import run_epidemic_forecast
from app.services.anonymization import public_district_summaries
from app.services import national_map
from app.services.bd_geo import DIVISION_DISPLAY
from app.core.config import settings
from app.ai.division_forecast_chain import run_division_forecast
import json

logger = logging.getLogger(__name__)
DIVISION_FORECAST_KIND = "division_epidemic_llm"


@celery_app.task(name="app.tasks.epidemic_forecast.run_epidemic_forecast_job")
def run_epidemic_forecast_job(job_id: str) -> None:
    """LLM epidemic forecast — does not call ARIMA/XGBoost."""
    db = SessionLocal()
    try:
        job = db.query(PopulationForecastJob).filter(PopulationForecastJob.id == job_id).first()
        if not job:
            logger.error("Epidemic forecast job %s not found", job_id)
            return

        job.status = "running"
        db.commit()

        aggregates = public_district_summaries(db)
        aggregates_text = json.dumps(aggregates, indent=2)
        result = run_epidemic_forecast(aggregates_text)
        payload = result.model_dump()
        payload["forecast_kind"] = "epidemic_llm"
        payload["engine"] = "llm"
        payload["pending"] = False
        job.result = payload
        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as exc:
        logger.exception("Epidemic forecast job %s failed", job_id)
        job = db.query(PopulationForecastJob).filter(PopulationForecastJob.id == job_id).first()
        if job:
            job.status = "failed"
            msg = str(exc)
            if "max_tokens" in msg.lower():
                job.error_message = "LLM output truncated — retry the forecast."
            else:
                job.error_message = msg[:500]
            job.completed_at = datetime.now(timezone.utc)
            prev = job.result if isinstance(job.result, dict) else {}
            job.result = {
                **{k: v for k, v in prev.items() if k != "pending"},
                "forecast_kind": "epidemic_llm",
                "pending": False,
            }
            db.commit()
    finally:
        db.close()


@celery_app.task(name="app.tasks.epidemic_forecast.run_division_epidemic_forecast_job")
def run_division_epidemic_forecast_job(job_id: str, scope_id: str) -> None:
    """Build a scoped scenario from annual, suppression-aware record aggregates."""
    db = SessionLocal()
    try:
        job = db.query(PopulationForecastJob).filter(PopulationForecastJob.id == job_id).first()
        if not job:
            logger.error("Division forecast job %s not found", job_id)
            return
        job.status = "running"
        db.commit()

        current_year = datetime.now(timezone.utc).year
        observations = {
            division_id: [point for point in points if 2022 <= int(point["year"]) <= current_year]
            for division_id, points in national_map.annual_division_observations(db, scope_id).items()
        }
        projection_start = current_year + 1
        future_years = list(range(projection_start, 2036))
        eligible = {
            division_id: points
            for division_id, points in observations.items()
            if len(points) >= 2 and future_years
        }
        projections: dict[str, dict[int, float]] = {}
        summary = "Insufficient unsuppressed annual history is available to generate a scenario."
        if eligible:
            llm_result = run_division_forecast({
                "divisions": [
                    {
                        "division_id": division_id,
                        "observations": points,
                        "forecast_years": future_years,
                    }
                    for division_id, points in eligible.items()
                ]
            })
            requested_ids = set(eligible)
            for projected in llm_result.projections:
                if projected.division_id not in requested_ids:
                    continue
                allowed_years = set(future_years)
                projections[projected.division_id] = {
                    point.year: point.high_risk_share
                    for point in projected.points
                    if point.year in allowed_years
                }
            summary = llm_result.summary

        series = []
        for division_id, display_name in DIVISION_DISPLAY.items():
            if division_id == "other" or (scope_id != "all" and division_id != scope_id):
                continue
            observed_by_year = {int(point["year"]): float(point["high_risk_share"]) for point in observations.get(division_id, [])}
            division_projections = projections.get(division_id, {})
            points = []
            for year in range(2022, 2036):
                if year in observed_by_year:
                    points.append({"year": year, "value": observed_by_year[year], "kind": "observed", "source": "scored submitted health records"})
                elif year in division_projections:
                    points.append({"year": year, "value": division_projections[year], "kind": "projected", "source": "configured LLM scenario"})
                else:
                    points.append({"year": year, "value": None, "kind": "unavailable", "source": None})
            series.append({
                "id": division_id,
                "name": display_name.removesuffix(" Division"),
                "status": "available" if any(point["value"] is not None for point in points) else "unavailable",
                "urban_rural_status": "unavailable",
                "points": points,
            })

        payload = {
            "forecast_kind": DIVISION_FORECAST_KIND,
            "scope_id": scope_id,
            "engine": "llm_scenario",
            "pending": False,
            "metric_basis": "high-risk share among scored submitted health records",
            "minimum_cell_size": settings.NATIONAL_MIN_CELL_SIZE,
            "display_years": list(range(2022, 2036)),
            "projection_start_year": projection_start if future_years else None,
            "urban_rural_status": "unavailable",
            "summary": summary,
            "series": series,
        }
        job.result = payload
        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as exc:
        logger.exception("Division forecast job %s failed", job_id)
        job = db.query(PopulationForecastJob).filter(PopulationForecastJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(exc)[:500]
            job.completed_at = datetime.now(timezone.utc)
            previous = job.result if isinstance(job.result, dict) else {}
            job.result = {**previous, "pending": False, "forecast_kind": DIVISION_FORECAST_KIND}
            db.commit()
    finally:
        db.close()
