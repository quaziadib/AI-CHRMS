from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, DB
from app.core.config import settings
from app.schemas.record import PatientRecordCreate, PatientRecordUpdate, PatientRecordResponse
from app.schemas.resubmit import HealthTrendsResponse, ResubmitStatusResponse
from app.services import record as record_service
from app.services import forecast_job as forecast_job_service
from app.services.resubmit import get_health_trends, get_resubmit_status
from app.schemas.forecast import ForecastJobResponse

router = APIRouter()


@router.get("/resubmit-status", response_model=ResubmitStatusResponse)
def resubmit_status(current_user: CurrentUser, db: DB):
    return get_resubmit_status(db, current_user.id)


@router.get("/history/trends", response_model=HealthTrendsResponse)
def health_trends(current_user: CurrentUser, db: DB):
    return get_health_trends(db, current_user.id)


@router.get("", response_model=list[PatientRecordResponse])
def list_records(current_user: CurrentUser, db: DB, skip: int = 0, limit: int = 100):
    return record_service.list_records(db, current_user.id, skip, limit)


@router.post("", response_model=PatientRecordResponse, status_code=201)
def create_record(data: PatientRecordCreate, current_user: CurrentUser, db: DB):
    return record_service.create_record(db, current_user.id, data)


@router.get("/{record_id}", response_model=PatientRecordResponse)
def get_record(record_id: str, current_user: CurrentUser, db: DB):
    return record_service.get_record(db, record_id, current_user.id, current_user.roles)


@router.patch("/{record_id}", response_model=PatientRecordResponse)
def update_record(record_id: str, data: PatientRecordUpdate, current_user: CurrentUser, db: DB):
    return record_service.update_record(db, record_id, current_user.id, current_user.roles, data)


@router.delete("/{record_id}", status_code=204)
def delete_record(record_id: str, current_user: CurrentUser, db: DB):
    record_service.delete_record(db, record_id, current_user.id, current_user.roles)


@router.post("/{record_id}/risk-score", response_model=PatientRecordResponse)
def score_record(record_id: str, current_user: CurrentUser, db: DB):
    return record_service.score_record(db, record_id, current_user.id, current_user.roles)


@router.post("/{record_id}/recommendations", response_model=PatientRecordResponse)
def generate_recommendations(record_id: str, current_user: CurrentUser, db: DB):
    if not settings.ENABLE_RECOMMENDATIONS:
        raise HTTPException(status_code=503, detail="Recommendations disabled")
    return record_service.recommend_record(db, record_id, current_user.id, current_user.roles)


@router.post("/{record_id}/personalized-plan", response_model=PatientRecordResponse)
def generate_personalized_plan(record_id: str, current_user: CurrentUser, db: DB):
    if not settings.ENABLE_PERSONALIZED_PLANS:
        raise HTTPException(status_code=503, detail="Personalized plans disabled")
    return record_service.generate_plan_record(db, record_id, current_user.id, current_user.roles)


@router.post("/{record_id}/forecast", response_model=ForecastJobResponse, status_code=202)
def start_forecast(record_id: str, current_user: CurrentUser, db: DB):
    if not settings.ENABLE_FORECASTING:
        raise HTTPException(status_code=503, detail="Forecasting disabled")
    job = forecast_job_service.enqueue_forecast(
        db, record_id, current_user.id, current_user.roles
    )
    return ForecastJobResponse.model_validate(job)


@router.get("/{record_id}/forecast/latest", response_model=ForecastJobResponse)
def get_latest_forecast(record_id: str, current_user: CurrentUser, db: DB):
    job = forecast_job_service.get_latest_forecast(
        db, record_id, current_user.id, current_user.roles
    )
    if not job:
        raise HTTPException(status_code=404, detail="No forecast job found")
    return ForecastJobResponse.model_validate(job)


@router.get("/{record_id}/forecast/{job_id}", response_model=ForecastJobResponse)
def get_forecast_job(record_id: str, job_id: str, current_user: CurrentUser, db: DB):
    job = forecast_job_service.get_forecast_job(
        db, record_id, job_id, current_user.id, current_user.roles
    )
    return ForecastJobResponse.model_validate(job)
