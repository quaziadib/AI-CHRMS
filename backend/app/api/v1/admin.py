from typing import Optional

from fastapi import APIRouter

from app.api.deps import AdminUser, DB
from app.schemas.audit import AdminStatsResponse, AuditLogResponse
from app.schemas.record import AssignDoctorRequest, PatientRecordResponse
from app.schemas.patient_sharing import AccessEventResponse
from app.schemas.user import AdminUserUpdate, UserResponse
from app.schemas.resubmit import SystemSettingsResponse, SystemSettingsUpdate
from app.services import admin as admin_service
from app.services import patient_sharing as sharing_service
from app.services.settings import get_or_create_settings, update_resubmit_interval_months

router = APIRouter()


@router.get("/stats", response_model=AdminStatsResponse)
def get_stats(admin: AdminUser, db: DB):
    return admin_service.get_stats(db)


@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    admin: AdminUser,
    db: DB,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    role: Optional[str] = None,
):
    return admin_service.list_users(db, skip=skip, limit=limit, search=search, role=role)


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


@router.patch("/records/{record_id}/assign-doctor", response_model=PatientRecordResponse)
def assign_doctor(record_id: str, body: AssignDoctorRequest, admin: AdminUser, db: DB):
    return admin_service.assign_doctor(db, admin.id, record_id, body.doctor_id)


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


@router.get("/patient-access-events", response_model=list[AccessEventResponse])
def get_patient_access_events(
    admin: AdminUser,
    db: DB,
    patient_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
):
    return sharing_service.list_access_events(db, patient_id=patient_id, skip=skip, limit=limit)


@router.get("/settings", response_model=SystemSettingsResponse)
def get_settings(admin: AdminUser, db: DB):
    row = get_or_create_settings(db)
    return SystemSettingsResponse(
        resubmit_interval_months=row.resubmit_interval_months,
        updated_at=row.updated_at,
        updated_by=row.updated_by,
    )


@router.patch("/settings", response_model=SystemSettingsResponse)
def update_settings(body: SystemSettingsUpdate, admin: AdminUser, db: DB):
    row = update_resubmit_interval_months(db, body.resubmit_interval_months, admin.id)
    return SystemSettingsResponse(
        resubmit_interval_months=row.resubmit_interval_months,
        updated_at=row.updated_at,
        updated_by=row.updated_by,
    )
