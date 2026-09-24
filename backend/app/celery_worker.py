from app.celery_app import celery_app as app
from app.tasks import epidemic_forecast, forecast, population_forecast

__all__ = ["app", "epidemic_forecast", "forecast", "population_forecast"]
