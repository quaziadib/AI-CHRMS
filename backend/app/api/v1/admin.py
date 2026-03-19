from typing import Optional

from fastapi import APIRouter

from app.api.deps import AdminUser, DB
from app.schemas.audit import AdminStatsResponse, AuditLogResponse
from app.schemas.record import PatientRecordResponse
from app.schemas.user import AdminUserUpdate, UserResponse
from app.services import admin as admin_service

router = APIRouter()


@router.get("/stats", response_model=AdminStatsResponse)
def get_stats(admin: AdminUser, db: DB):
    return admin_service.get_stats(db)


@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    admin: AdminUser, db: DB, skip: int = 0, limit: int = 100, search: Optional[str] = None
):
    return admin_service.list_users(db, skip=skip, limit=limit, search=search)


@router.get("/users/{user_id}", response_model=UserResponse)
def get_user(user_id: str, admin: AdminUser, db: DB):
    return admin_service.get_user(db, user_id)


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: str, updates: AdminUserUpdate, admin: AdminUser, db: DB):
    return admin_service.admin_update_user(db, admin.id, user_id, updates.model_dump(exclude_none=True))


@router.get("/records", response_model=list[PatientRecordResponse])
def get_all_records(
    admin: AdminUser, db: DB, skip: int = 0, limit: int = 100, user_id: Optional[str] = None
):
    return admin_service.list_all_records(db, skip=skip, limit=limit, user_id=user_id)


@router.get("/audit-logs", response_model=list[AuditLogResponse])
def get_audit_logs(
    admin: AdminUser,
    db: DB,
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
):
    return admin_service.list_audit_logs(db, skip=skip, limit=limit, user_id=user_id, action=action)
