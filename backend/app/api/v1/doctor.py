import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.ai.ehr_summary_chain import run_ehr_summary_chain
from app.api.deps import DB, DoctorUser
from app.core.config import settings
from app.models.record import PatientRecord
from app.models.user import User
from app.schemas.record import PatientRecordResponse
from app.services.audit import log_audit

logger = logging.getLogger(__name__)

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


@router.post("/patients/{record_id}/summarize", response_model=PatientRecordResponse)
def summarize_patient_ehr(record_id: str, doctor: DoctorUser, db: DB):
    if not settings.ENABLE_EHR_SUMMARY:
        raise HTTPException(status_code=503, detail="EHR summarization is currently disabled")

    record = (
        db.query(PatientRecord)
        .filter(PatientRecord.id == record_id, PatientRecord.doctor_id == doctor.id)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    try:
        summary = run_ehr_summary_chain(record)
    except Exception:
        logger.exception("EHR summary chain failed for record %s", record_id)
        raise HTTPException(status_code=502, detail="EHR summarization unavailable. Please try again.")

    record.ehr_summary = summary
    record.ehr_summary_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)

    log_audit(db, doctor.id, "ehr_summary_generated", "patient_record", record_id)

    return _enrich(record, db)
