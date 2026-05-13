from typing import Optional

from fastapi import APIRouter, HTTPException

from app.api.deps import DB, DoctorUser
from app.models.record import PatientRecord
from app.models.user import User
from app.schemas.record import PatientRecordResponse

router = APIRouter()


def _enrich(record: PatientRecord, db) -> PatientRecordResponse:
    resp = PatientRecordResponse.model_validate(record)
    patient = db.query(User).filter(User.id == record.user_id).first()
    resp.patient_name = patient.full_name if patient else None
    return resp


@router.get("/patients", response_model=list[PatientRecordResponse])
def list_assigned_patients(
    doctor: DoctorUser,
    db: DB,
    risk_level: Optional[str] = None,
):
    query = db.query(PatientRecord).filter(PatientRecord.doctor_id == doctor.id)
    if risk_level:
        query = query.filter(PatientRecord.risk_level == risk_level)
    records = query.order_by(PatientRecord.created_at.desc()).all()
    return [_enrich(r, db) for r in records]


@router.get("/patients/{record_id}", response_model=PatientRecordResponse)
def get_assigned_patient(record_id: str, doctor: DoctorUser, db: DB):
    record = (
        db.query(PatientRecord)
        .filter(PatientRecord.id == record_id, PatientRecord.doctor_id == doctor.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return _enrich(record, db)
