from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, DB
from app.core.config import settings
from app.schemas.record import PatientRecordCreate, PatientRecordUpdate, PatientRecordResponse
from app.services import record as record_service

router = APIRouter()


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
