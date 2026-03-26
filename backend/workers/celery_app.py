"""Celery application factory.

Start worker:
    celery -A workers.celery_app worker --loglevel=info

Start beat scheduler (periodic tasks):
    celery -A workers.celery_app beat --loglevel=info
"""

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "chrms",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    # Retry failed tasks up to 3 times with exponential back-off
    task_annotations={
        "*": {
            "max_retries": 3,
            "default_retry_delay": 60,
        }
    },
)
