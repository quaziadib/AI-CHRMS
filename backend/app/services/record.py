import logging
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.ai.embedding_service import embed_record
from app.ai.plans_chain import run_personalized_plan_chain
from app.ai.recommendations_chain import run_recommendations_chain
from app.ai.risk_chain import run_risk_chain
from app.core.config import settings
from app.core.security import generate_pid
from app.models.record import PatientRecord
from app.schemas.record import PatientRecordCreate, PatientRecordUpdate, PatientRecordResponse
from app.services.audit import log_audit
from app.services.flagging import compute_flags
from app.services.resubmit import get_resubmit_status
from app.services.snapshot import capture_health_snapshot

logger = logging.getLogger(__name__)


def _maybe_embed_record(db: Session, record: PatientRecord) -> None:
    try:
        embed_record(record, db)
    except Exception:
        logger.exception("Failed to embed record %s", record.id)


def _maybe_generate_plan(db: Session, record: PatientRecord, user_id: str, record_id: str) -> None:
    if not settings.ENABLE_PERSONALIZED_PLANS or not record.risk_level:
        return
    try:
        plan = run_personalized_plan_chain(record)
        record.personalized_plan = plan.model_dump()
        record.personalized_plan_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(record)
        log_audit(db, user_id, "personalized_plan_generated", "patient_record", record_id)
        _maybe_embed_record(db, record)
    except Exception:
        logger.exception("Failed to generate personalized plan for record %s", record_id)


def _get_record_or_404(db: Session, record_id: str) -> PatientRecord:
    record = db.query(PatientRecord).filter(PatientRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


def _check_ownership(record: PatientRecord, user_id: str, roles: list[str]) -> None:
    if record.user_id != user_id and "admin" not in roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")


def list_records(
    db: Session, user_id: str, skip: int = 0, limit: int = 100
) -> list[PatientRecordResponse]:
    records = (
        db.query(PatientRecord)
        .filter(PatientRecord.user_id == user_id)
        .order_by(PatientRecord.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [PatientRecordResponse.model_validate(r) for r in records]


def get_record(
    db: Session, record_id: str, user_id: str, roles: list[str]
) -> PatientRecordResponse:
    record = _get_record_or_404(db, record_id)
    _check_ownership(record, user_id, roles)
    return PatientRecordResponse.model_validate(record)


def create_record(
    db: Session, user_id: str, data: PatientRecordCreate
) -> PatientRecordResponse:
    status_info = get_resubmit_status(db, user_id)
    if not status_info.can_submit_new:
        due = status_info.next_due_at.strftime("%d %b %Y") if status_info.next_due_at else "later"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Resubmit is not due yet. Your next assessment is due on {due}.",
        )

    previous = (
        db.query(PatientRecord)
        .filter(PatientRecord.user_id == user_id)
        .order_by(PatientRecord.created_at.desc())
        .first()
    )
    record = PatientRecord(
        user_id=user_id,
        pid=generate_pid(),
        doctor_id=previous.doctor_id if previous else None,
        **data.model_dump(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    record.flags = compute_flags(record)
    db.commit()
    capture_health_snapshot(db, record)
    log_audit(db, user_id, "create_record", "patient_record", record.id)
    return PatientRecordResponse.model_validate(record)


def update_record(
    db: Session,
    record_id: str,
    user_id: str,
    roles: list[str],
    data: PatientRecordUpdate,
) -> PatientRecordResponse:
    record = _get_record_or_404(db, record_id)
    _check_ownership(record, user_id, roles)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(record, field, value)
    record.flags = compute_flags(record)
    db.commit()
    db.refresh(record)
    log_audit(db, user_id, "update_record", "patient_record", record_id)
    risk_scored = False
    try:
        assessment = run_risk_chain(record)
        record.risk_level = assessment.risk_level
        record.risk_explanation = assessment.explanation
        record.risk_scored_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(record)
        log_audit(db, user_id, "risk_scored", "patient_record", record_id)
        risk_scored = True
    except Exception:
        pass
    if risk_scored and settings.ENABLE_RECOMMENDATIONS:
        try:
            recs = run_recommendations_chain(record)
            record.recommendations = recs.model_dump()
            db.commit()
            db.refresh(record)
            log_audit(db, user_id, "recommendations_generated", "patient_record", record_id)
        except Exception:
            record.recommendations = None
    db.refresh(record)
    capture_health_snapshot(db, record)
    _maybe_generate_plan(db, record, user_id, record_id)
    _maybe_embed_record(db, record)
    return PatientRecordResponse.model_validate(record)


def delete_record(
    db: Session, record_id: str, user_id: str, roles: list[str]
) -> None:
    record = _get_record_or_404(db, record_id)
    _check_ownership(record, user_id, roles)
    db.delete(record)
    db.commit()
    log_audit(db, user_id, "delete_record", "patient_record", record_id)


def score_record(
    db: Session, record_id: str, user_id: str, roles: list[str]
) -> PatientRecordResponse:
    record = _get_record_or_404(db, record_id)
    _check_ownership(record, user_id, roles)
    try:
        assessment = run_risk_chain(record)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=502, detail="Risk scoring unavailable")
    record.risk_level = assessment.risk_level
    record.risk_explanation = assessment.explanation
    record.risk_scored_at = datetime.now(timezone.utc)
    record.flags = compute_flags(record)
    db.commit()
    db.refresh(record)
    log_audit(db, user_id, "risk_scored", "patient_record", record_id)
    if settings.ENABLE_RECOMMENDATIONS:
        try:
            recs = run_recommendations_chain(record)
            record.recommendations = recs.model_dump()
            db.commit()
            db.refresh(record)
            log_audit(db, user_id, "recommendations_generated", "patient_record", record_id)
        except Exception:
            record.recommendations = None
    db.refresh(record)
    capture_health_snapshot(db, record)
    _maybe_generate_plan(db, record, user_id, record_id)
    _maybe_embed_record(db, record)
    return PatientRecordResponse.model_validate(record)


def recommend_record(
    db: Session, record_id: str, user_id: str, roles: list[str]
) -> PatientRecordResponse:
    record = _get_record_or_404(db, record_id)
    _check_ownership(record, user_id, roles)
    try:
        recs = run_recommendations_chain(record)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=502, detail="Recommendations unavailable")
    record.recommendations = recs.model_dump()
    db.commit()
    db.refresh(record)
    log_audit(db, user_id, "recommendations_generated", "patient_record", record_id)
    _maybe_embed_record(db, record)
    return PatientRecordResponse.model_validate(record)


def generate_plan_record(
    db: Session, record_id: str, user_id: str, roles: list[str]
) -> PatientRecordResponse:
    record = _get_record_or_404(db, record_id)
    _check_ownership(record, user_id, roles)
    if not record.risk_level:
        raise HTTPException(status_code=400, detail="Risk assessment required before generating a plan")
    try:
        plan = run_personalized_plan_chain(record)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=502, detail="Personalized plan unavailable")
    record.personalized_plan = plan.model_dump()
    record.personalized_plan_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(record)
    log_audit(db, user_id, "personalized_plan_generated", "patient_record", record_id)
    _maybe_embed_record(db, record)
    return PatientRecordResponse.model_validate(record)
