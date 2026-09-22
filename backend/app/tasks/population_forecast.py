import logging
from datetime import datetime, timezone

from app.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.population_forecast import PopulationForecastJob
from app.services.anonymization import monthly_district_series
from app.services.population_forecast_engine import build_population_forecast_result

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.population_forecast.run_population_forecast_job")
def run_population_forecast_job(job_id: str) -> None:
    db = SessionLocal()
    try:
        job = db.query(PopulationForecastJob).filter(PopulationForecastJob.id == job_id).first()
        if not job:
            logger.error("Population forecast job %s not found", job_id)
            return

        job.status = "running"
        db.commit()

        series = monthly_district_series(db)
        job.result = build_population_forecast_result(series)
        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as exc:
        logger.exception("Population forecast job %s failed", job_id)
        job = db.query(PopulationForecastJob).filter(PopulationForecastJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(exc)
            job.completed_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()
