import logging
from datetime import datetime, timezone

from app.celery_app import celery_app
from app.db.session import SessionLocal
from app.models.population_forecast import PopulationForecastJob
from app.ai.epidemic_forecast_chain import run_epidemic_forecast
from app.services.anonymization import public_district_summaries
import json

logger = logging.getLogger(__name__)


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
