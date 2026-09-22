import logging

from sqlalchemy.orm import Session

from app.models.population_forecast import PopulationForecastJob
from app.tasks.population_forecast import run_population_forecast_job
from app.tasks.epidemic_forecast import run_epidemic_forecast_job

logger = logging.getLogger(__name__)

EPIDEMIC_FORECAST_KIND = "epidemic_llm"
_RECENT_JOB_SCAN = 50


def is_epidemic_forecast_job(job: PopulationForecastJob) -> bool:
    return bool(job.result and job.result.get("forecast_kind") == EPIDEMIC_FORECAST_KIND)


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
        logger.exception(
            "Failed to enqueue epidemic forecast job %s — running synchronously", job.id
        )
        run_epidemic_forecast_job(job.id)
        db.refresh(job)

    return job


def get_latest_population_forecast(db: Session) -> PopulationForecastJob | None:
    jobs = (
        db.query(PopulationForecastJob)
        .order_by(PopulationForecastJob.created_at.desc())
        .limit(_RECENT_JOB_SCAN)
        .all()
    )
    for job in jobs:
        if not is_epidemic_forecast_job(job):
            return job
    return None


def get_latest_epidemic_forecast(db: Session) -> PopulationForecastJob | None:
    jobs = (
        db.query(PopulationForecastJob)
        .order_by(PopulationForecastJob.created_at.desc())
        .limit(_RECENT_JOB_SCAN)
        .all()
    )
    for job in jobs:
        if is_epidemic_forecast_job(job):
            return job
    return None


def get_latest_completed_population_forecast(db: Session) -> PopulationForecastJob | None:
    """Latest completed district population forecast (excludes epidemic_llm jobs)."""
    jobs = (
        db.query(PopulationForecastJob)
        .filter(PopulationForecastJob.status == "completed")
        .order_by(PopulationForecastJob.completed_at.desc())
        .limit(_RECENT_JOB_SCAN)
        .all()
    )
    for job in jobs:
        if is_epidemic_forecast_job(job):
            continue
        if job.result and isinstance(job.result.get("districts"), list):
            return job
    return None


def get_population_forecast_job(db: Session, job_id: str) -> PopulationForecastJob | None:
    return db.query(PopulationForecastJob).filter(PopulationForecastJob.id == job_id).first()
