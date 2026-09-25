import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, status

from app.api.deps import DB, DoctorUser
from app.core.config import settings
from app.models.record import PatientRecord
from app.models.user import User
from app.schemas.patient_sharing import (
    DoctorPatientListItem,
    DoctorPatientProfileResponse,
    GrantDecision,
    InteractionCreate,
    InteractionResponse,
    PatientGrantResponse,
)
from app.schemas.record import PatientRecordResponse
from app.services import patient_sharing as sharing_service
from app.services.audit import log_audit

logger = logging.getLogger(__name__)

router = APIRouter()


def _enrich(record: PatientRecord, db) -> PatientRecordResponse:
    resp = PatientRecordResponse.model_validate(record)
    patient = db.query(User).filter(User.id == record.user_id).first()
    resp.patient_name = patient.full_name if patient else None
    return resp


@router.get("/patients", response_model=list[DoctorPatientListItem])
def list_assigned_patients(
    doctor: DoctorUser,
    db: DB,
    risk_level: Optional[str] = None,
    district: Optional[str] = None,
):
    return sharing_service.list_doctor_profiles(
        db, doctor.id, risk_level=risk_level, district=district
    )


@router.get("/patients/{patient_id}", response_model=DoctorPatientProfileResponse)
def get_assigned_patient(patient_id: str, doctor: DoctorUser, db: DB) -> DoctorPatientProfileResponse:
    return sharing_service.get_doctor_profile(db, doctor.id, patient_id)


@router.post("/patients/{patient_id}/summarize", response_model=PatientRecordResponse)
def summarize_patient_ehr(patient_id: str, doctor: DoctorUser, db: DB):
    if not settings.ENABLE_EHR_SUMMARY:
        raise HTTPException(status_code=503, detail="EHR summarization is currently disabled")

    grant = sharing_service.require_active_grant(db, doctor.id, patient_id)
    record = db.query(PatientRecord).filter(
        PatientRecord.user_id == patient_id
    ).order_by(PatientRecord.created_at.desc()).first()
    if not record:
        raise HTTPException(status_code=404, detail="Patient health record not found")
    sharing_service.record_profile_event(db, grant, doctor.id, "ehr_summary_requested")

    try:
        from app.ai.ehr_summary_chain import run_ehr_summary_chain
        summary = run_ehr_summary_chain(record)
    except Exception:
        logger.exception("EHR summary chain failed for patient %s", patient_id)
        raise HTTPException(status_code=502, detail="EHR summarization unavailable. Please try again.")

    record.ehr_summary = summary
    record.ehr_summary_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)

    log_audit(db, doctor.id, "ehr_summary_generated", "patient_record", record.id)

    try:
        from app.ai.embedding_service import embed_record
        embed_record(record, db)
    except Exception:
        logger.exception("Failed to embed record %s after EHR summary", record.id)

    return _enrich(record, db)


@router.get("/access-requests", response_model=list[PatientGrantResponse])
def list_access_requests(doctor: DoctorUser, db: DB):
    return sharing_service.list_doctor_requests(db, doctor.id)


@router.post("/access-requests/{grant_id}/respond", response_model=PatientGrantResponse)
def respond_to_access_request(grant_id: str, body: GrantDecision, doctor: DoctorUser, db: DB):
    return sharing_service.decide_grant(db, doctor.id, grant_id, body.decision)


@router.post(
    "/patients/{patient_id}/interactions",
    response_model=InteractionResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_patient_interaction(patient_id: str, body: InteractionCreate, doctor: DoctorUser, db: DB):
    return sharing_service.add_interaction(db, doctor.id, patient_id, body)
