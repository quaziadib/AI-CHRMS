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
from app.schemas.user import UserResponse, roles_for_approved_signup
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
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[str] = None,
) -> list[UserResponse]:
    query = db.query(User)
    if search:
        pattern = f"%{search.lower()}%"
        query = query.filter(
            (User.email.ilike(pattern)) | (User.full_name.ilike(pattern))
        )
    if role:
        query = query.filter(User.roles.contains([role]))
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


def assign_doctor(
    db: Session, admin_id: str, record_id: str, doctor_id: str | None
) -> PatientRecordResponse:
    record = db.query(PatientRecord).filter(PatientRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")

    if doctor_id is not None:
        doctor = db.query(User).filter(User.id == doctor_id).first()
        if not doctor or "doctor" not in doctor.roles:
            raise HTTPException(status_code=400, detail="User is not a doctor")

    record.doctor_id = doctor_id
    db.commit()
    db.refresh(record)

    log_audit(db, admin_id, "doctor_assigned", "record", record_id)

    resp = PatientRecordResponse.model_validate(record)
    if doctor_id:
        doctor = db.query(User).filter(User.id == doctor_id).first()
        resp.doctor_name = doctor.full_name if doctor else None
    patient = db.query(User).filter(User.id == record.user_id).first()
    resp.patient_name = patient.full_name if patient else None
    return resp


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


def list_role_requests(
    db: Session,
    status: str = "pending",
    skip: int = 0,
    limit: int = 100,
) -> list[UserResponse]:
    query = db.query(User).filter(User.role_request_status == status)
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return [UserResponse.model_validate(u) for u in users]


def approve_role_request(db: Session, admin_id: str, user_id: str) -> UserResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role_request_status != "pending" or not user.requested_role:
        raise HTTPException(status_code=400, detail="No pending role request for this user")

    user.roles = roles_for_approved_signup(user.requested_role)
    user.role_request_status = "approved"
    db.commit()
    db.refresh(user)
    log_audit(db, admin_id, "role_request_approved", "user", user_id)
    return UserResponse.model_validate(user)


def reject_role_request(db: Session, admin_id: str, user_id: str) -> UserResponse:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role_request_status != "pending" or not user.requested_role:
        raise HTTPException(status_code=400, detail="No pending role request for this user")

    user.roles = ["user"]
    user.role_request_status = "rejected"
    db.commit()
    db.refresh(user)
    log_audit(db, admin_id, "role_request_rejected", "user", user_id)
    return UserResponse.model_validate(user)
