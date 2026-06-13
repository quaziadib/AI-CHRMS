import logging
from datetime import datetime, timezone

from app.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.forecast_job import ForecastJob
from app.models.health_snapshot import HealthSnapshot
from app.models.record import PatientRecord
from app.services.forecast import build_forecast_result

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.forecast.run_forecast_job")
def run_forecast_job(job_id: str) -> None:
    db = SessionLocal()
    try:
        job = db.query(ForecastJob).filter(ForecastJob.id == job_id).first()
        if not job:
            logger.error("Forecast job %s not found", job_id)
            return

        job.status = "running"
        db.commit()

        record = db.query(PatientRecord).filter(PatientRecord.id == job.record_id).first()
        if not record:
            job.status = "failed"
            job.error_message = "Record not found"
            job.completed_at = datetime.now(timezone.utc)
            db.commit()
            return

        snapshots = (
            db.query(HealthSnapshot)
            .filter(HealthSnapshot.record_id == record.id)
            .order_by(HealthSnapshot.captured_at.asc())
            .all()
        )

        job.result = build_forecast_result(snapshots, record)
        job.status = "completed"
        job.completed_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as exc:
        logger.exception("Forecast job %s failed", job_id)
        job = db.query(ForecastJob).filter(ForecastJob.id == job_id).first()
        if job:
            job.status = "failed"
            job.error_message = str(exc)
            job.completed_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()
