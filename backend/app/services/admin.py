from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.record import PatientRecord
from app.models.user import User
from app.schemas.audit import AdminStatsResponse, AuditLogResponse
from app.schemas.record import PatientRecordResponse
from app.schemas.user import UserResponse
from app.services.audit import log_audit


def get_stats(db: Session) -> AdminStatsResponse:
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)

    def _count(model, *filters):
        q = db.query(func.count(model.id))
        for f in filters:
            q = q.filter(f)
        return q.scalar()

    return AdminStatsResponse(
        total_users=_count(User),
        active_users=_count(User, User.is_active == True),
        total_records=_count(PatientRecord),
        records_today=_count(PatientRecord, PatientRecord.created_at >= today_start),
        records_this_week=_count(PatientRecord, PatientRecord.created_at >= week_start),
        records_this_month=_count(PatientRecord, PatientRecord.created_at >= month_start),
    )


def list_users(
    db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None
) -> list[UserResponse]:
    query = db.query(User)
    if search:
        pattern = f"%{search.lower()}%"
        query = query.filter(
            (User.email.ilike(pattern)) | (User.full_name.ilike(pattern))
        )
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]


def get_user(db: Session, user_id: str) -> UserResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)


def admin_update_user(
    db: Session, admin_id: str, user_id: str, updates: dict
) -> UserResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    allowed = {"is_active", "is_verified", "roles"}
    for field, value in updates.items():
        if field in allowed:
            setattr(user, field, value)
    db.commit()
    db.refresh(user)
    log_audit(db, admin_id, "admin_update_user", "user", user_id)
    return UserResponse.model_validate(user)


def list_all_records(
    db: Session, skip: int = 0, limit: int = 100, user_id: Optional[str] = None
) -> list[PatientRecordResponse]:
    query = db.query(PatientRecord)
    if user_id:
        query = query.filter(PatientRecord.user_id == user_id)
    records = query.order_by(PatientRecord.created_at.desc()).offset(skip).limit(limit).all()
    return [PatientRecordResponse.model_validate(r) for r in records]


def list_audit_logs(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
) -> list[AuditLogResponse]:
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action == action)
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    return [AuditLogResponse.model_validate(log) for log in logs]
