from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.ai.recommendations_chain import run_recommendations_chain
from app.ai.risk_chain import run_risk_chain
from app.core.config import settings
from app.core.security import generate_pid
from app.models.record import PatientRecord
from app.schemas.record import PatientRecordCreate, PatientRecordUpdate, PatientRecordResponse
from app.services.audit import log_audit


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
    existing = db.query(PatientRecord).filter(PatientRecord.user_id == user_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted a health record. Use edit to update it.",
        )
    record = PatientRecord(user_id=user_id, pid=generate_pid(), **data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
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
    return PatientRecordResponse.model_validate(record)
