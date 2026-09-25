import os

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "health_project",
    broker=os.environ.get("CELERY_BROKER_URL") or settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    result_backend=None,
    task_ignore_result=True,
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)

# Do not autodiscover here — that imports heavy AI/forecast task modules and
# slows or stalls the web process. The worker registers tasks in celery_worker.py.
