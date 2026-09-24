import logging
import os
from datetime import datetime, timezone

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models.population_forecast import PopulationForecastJob
from app.tasks.population_forecast import run_population_forecast_job
from app.tasks.epidemic_forecast import run_epidemic_forecast_job

logger = logging.getLogger(__name__)

EPIDEMIC_FORECAST_KIND = "epidemic_llm"
DIVISION_FORECAST_KIND = "division_epidemic_llm"
_LLM_FORECAST_KINDS = (EPIDEMIC_FORECAST_KIND, DIVISION_FORECAST_KIND)


def is_epidemic_forecast_job(job: PopulationForecastJob) -> bool:
    return bool(job.result and job.result.get("forecast_kind") == EPIDEMIC_FORECAST_KIND)


def is_llm_epidemic_job(job: PopulationForecastJob) -> bool:
    return bool(
        job.result
        and job.result.get("forecast_kind") in {EPIDEMIC_FORECAST_KIND, DIVISION_FORECAST_KIND}
    )


def _forecast_kind():
    return PopulationForecastJob.result["forecast_kind"].astext


def _not_llm_forecast_job():
    """District statistical jobs have no forecast_kind (or a non-LLM kind)."""
    kind = _forecast_kind()
    return or_(
        PopulationForecastJob.result.is_(None),
        kind.is_(None),
        ~kind.in_(_LLM_FORECAST_KINDS),
    )


def enqueue_population_forecast(db: Session, user_id: str) -> PopulationForecastJob:
    job = PopulationForecastJob(
        requested_by=user_id,
        status="pending",
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        run_population_forecast_job.delay(job.id)
    except Exception:
        if os.environ.get("VERCEL"):
            logger.exception("Failed to enqueue population forecast job %s", job.id)
            job.status = "failed"
            job.error_message = "Background job queue is unavailable"
            job.completed_at = datetime.now(timezone.utc)
        else:
            logger.exception(
                "Failed to enqueue population forecast job %s — running synchronously", job.id
            )
            run_population_forecast_job(job.id)
        db.refresh(job)

    return job


def enqueue_epidemic_forecast(db: Session, user_id: str) -> PopulationForecastJob:
    job = PopulationForecastJob(
        requested_by=user_id,
        status="pending",
        result={"forecast_kind": EPIDEMIC_FORECAST_KIND, "pending": True},
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        run_epidemic_forecast_job.delay(job.id)
    except Exception:
        if os.environ.get("VERCEL"):
            logger.exception("Failed to enqueue epidemic forecast job %s", job.id)
            job.status = "failed"
            job.error_message = "Background job queue is unavailable"
            job.completed_at = datetime.now(timezone.utc)
        else:
            logger.exception(
                "Failed to enqueue epidemic forecast job %s — running synchronously", job.id
            )
            run_epidemic_forecast_job(job.id)
        db.refresh(job)

    return job


def enqueue_division_forecast(db: Session, user_id: str, scope_id: str) -> PopulationForecastJob:
    job = PopulationForecastJob(
        requested_by=user_id,
        status="pending",
        result={"forecast_kind": DIVISION_FORECAST_KIND, "scope_id": scope_id, "pending": True},
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    try:
        from app.tasks.epidemic_forecast import run_division_epidemic_forecast_job
        run_division_epidemic_forecast_job.delay(job.id, scope_id)
    except Exception:
        if os.environ.get("VERCEL"):
            logger.exception("Failed to enqueue division forecast job %s", job.id)
            job.status = "failed"
            job.error_message = "Background job queue is unavailable"
            job.completed_at = datetime.now(timezone.utc)
        else:
            logger.exception("Failed to enqueue division forecast job %s — running synchronously", job.id)
            from app.tasks.epidemic_forecast import run_division_epidemic_forecast_job
            run_division_epidemic_forecast_job(job.id, scope_id)
        db.refresh(job)
    return job


def get_latest_population_forecast(db: Session) -> PopulationForecastJob | None:
    return (
        db.query(PopulationForecastJob)
        .filter(_not_llm_forecast_job())
        .order_by(PopulationForecastJob.created_at.desc())
        .first()
    )


def get_latest_epidemic_forecast(db: Session) -> PopulationForecastJob | None:
    return (
        db.query(PopulationForecastJob)
        .filter(_forecast_kind() == EPIDEMIC_FORECAST_KIND)
        .order_by(PopulationForecastJob.created_at.desc())
        .first()
    )


def get_latest_division_forecast(db: Session, scope_id: str) -> PopulationForecastJob | None:
    return (
        db.query(PopulationForecastJob)
        .filter(
            _forecast_kind() == DIVISION_FORECAST_KIND,
            PopulationForecastJob.result["scope_id"].astext == scope_id,
        )
        .order_by(PopulationForecastJob.created_at.desc())
        .first()
    )


def get_latest_completed_population_forecast(db: Session) -> PopulationForecastJob | None:
    """Latest completed district population forecast (excludes LLM epidemic/division jobs)."""
    return (
        db.query(PopulationForecastJob)
        .filter(
            PopulationForecastJob.status == "completed",
            _not_llm_forecast_job(),
            func.jsonb_typeof(PopulationForecastJob.result["districts"]) == "array",
        )
        .order_by(PopulationForecastJob.completed_at.desc())
        .first()
    )


def get_population_forecast_job(db: Session, job_id: str) -> PopulationForecastJob | None:
    return db.query(PopulationForecastJob).filter(PopulationForecastJob.id == job_id).first()
