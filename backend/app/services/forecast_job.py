import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.forecast_job import ForecastJob
from app.models.record import PatientRecord
from app.tasks.forecast import run_forecast_job

logger = logging.getLogger(__name__)


def _get_record_or_404(db: Session, record_id: str) -> PatientRecord:
    record = db.query(PatientRecord).filter(PatientRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


def _check_ownership(record: PatientRecord, user_id: str, roles: list[str]) -> None:
    if record.user_id != user_id and "admin" not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def enqueue_forecast(
    db: Session, record_id: str, user_id: str, roles: list[str]
) -> ForecastJob:
    record = _get_record_or_404(db, record_id)
    _check_ownership(record, user_id, roles)

    if not record.risk_level:
        raise HTTPException(
            status_code=400,
            detail="Risk assessment required before generating a forecast",
        )

    job = ForecastJob(
        record_id=record.id,
        user_id=user_id,
        status="pending",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        run_forecast_job.delay(job.id)
    except Exception:
        logger.exception("Failed to enqueue forecast job %s — running synchronously", job.id)
        run_forecast_job(job.id)
        db.refresh(job)

    return job


def get_forecast_job(
    db: Session, record_id: str, job_id: str, user_id: str, roles: list[str]
) -> ForecastJob:
    record = _get_record_or_404(db, record_id)
    _check_ownership(record, user_id, roles)
    job = (
        db.query(ForecastJob)
        .filter(ForecastJob.id == job_id, ForecastJob.record_id == record_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Forecast job not found")
    return job


def get_latest_forecast(
    db: Session, record_id: str, user_id: str, roles: list[str]
) -> ForecastJob | None:
    record = _get_record_or_404(db, record_id)
    _check_ownership(record, user_id, roles)
    return (
        db.query(ForecastJob)
        .filter(ForecastJob.record_id == record_id)
        .order_by(ForecastJob.created_at.desc())
        .first()
    )
