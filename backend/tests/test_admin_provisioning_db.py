"""DB-backed tests for admin user provisioning and legacy role-request approval.

Skipped when no PostgreSQL is reachable at DATABASE_URL.
"""

from __future__ import annotations

import uuid

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import verify_password
from app.db.base import engine
from app.db.init_db import create_tables
from app.main import app
from app.models.audit import AuditLog
from app.models.doctor_profile import DoctorProfile
from app.models.user import User
from app.schemas.user import AdminUserCreate, DoctorProfileCreate
from app.services import admin as admin_service
from app.services import patient_sharing as sharing
from app.services.auth import login_user


def _db_available() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(not _db_available(), reason="PostgreSQL not available")

SUFFIX = "@ap-test.example.com"


@pytest.fixture()
def db():
    create_tables()
    with Session(engine) as session:
        yield session
        session.rollback()
        ids = [u.id for u in session.query(User).filter(User.email.like(f"%{SUFFIX}"))]
        if ids:
            session.query(AuditLog).filter(AuditLog.user_id.in_(ids)).delete(synchronize_session=False)
            session.query(AuditLog).filter(AuditLog.entity_id.in_(ids)).delete(synchronize_session=False)
            session.query(User).filter(User.id.in_(ids)).delete(synchronize_session=False)
        session.commit()


def _email(tag: str) -> str:
    return f"{tag}-{uuid.uuid4().hex[:8]}{SUFFIX}"


def _admin(db) -> User:
    admin = User(email=_email("admin"), password_hash="x", full_name="Root Admin", roles=["admin", "user"])
    db.add(admin)
    db.commit()
    return admin


_PROFILE = DoctorProfileCreate(
    specialization="Endocrinology", division="Dhaka Division", district="Dhaka", location="Shahbag",
)


def test_admin_creates_active_national_admin_with_audit(db):
    admin = _admin(db)
    resp = admin_service.create_user(db, admin.id, AdminUserCreate(
        email=_email("nat"), password="password1", full_name="Nat Admin", role="national_admin",
    ))
    user = db.query(User).filter(User.id == resp.id).one()
    assert user.roles == ["national_admin"]
    assert user.is_active and user.is_verified
    assert user.requested_role is None and user.role_request_status is None
    assert verify_password("password1", user.password_hash)
    audit = db.query(AuditLog).filter(AuditLog.entity_id == user.id).one()
    assert audit.user_id == admin.id and audit.action == "admin_user_created:national_admin"
    token = login_user(db, user.email, "password1")
    assert "national_admin" in token.user.roles


def test_admin_creates_admin_dual_role(db):
    admin = _admin(db)
    resp = admin_service.create_user(db, admin.id, AdminUserCreate(
        email=_email("adm"), password="password1", full_name="Second Admin", role="admin",
    ))
    assert resp.roles == ["admin", "user"] and resp.role_request_status is None


def test_admin_creates_doctor_with_profile_searchable(db):
    admin = _admin(db)
    resp = admin_service.create_user(db, admin.id, AdminUserCreate(
        email=_email("doc"), password="password1", full_name="Dr Qqprovisioned", role="doctor",
        doctor_profile=_PROFILE,
    ))
    assert resp.roles == ["doctor"]
    assert db.query(DoctorProfile).filter(DoctorProfile.user_id == resp.id).one().specialization == "Endocrinology"
    names = {i.full_name for i in sharing.search_doctors(db, q="Qqprovisioned", search_by="name").items}
    assert names == {"Dr Qqprovisioned"}


def test_admin_create_duplicate_email_rejected(db):
    admin = _admin(db)
    with pytest.raises(HTTPException) as exc:
        admin_service.create_user(db, admin.id, AdminUserCreate(
            email=admin.email, password="password1", full_name="Dup", role="user",
        ))
    assert exc.value.status_code == 400 and "already registered" in exc.value.detail


def test_legacy_pending_national_admin_still_approvable(db):
    admin = _admin(db)
    legacy = User(
        email=_email("legacy"), password_hash="x", full_name="Legacy Nat", roles=["user"],
        requested_role="national_admin", role_request_status="pending",
    )
    db.add(legacy)
    db.commit()
    resp = admin_service.approve_role_request(db, admin.id, legacy.id)
    assert resp.roles == ["national_admin"] and resp.role_request_status == "approved"


def test_create_user_endpoint_auth(db):
    admin = _admin(db)
    doctor = User(email=_email("d"), password_hash="x", full_name="Dr D", roles=["doctor"])
    db.add(doctor)
    db.commit()
    client = TestClient(app)
    payload = {"email": _email("new"), "password": "password1", "full_name": "New Person", "role": "national_admin"}

    assert client.post("/v1/admin/users", json=payload).status_code == 401

    app.dependency_overrides[get_current_user] = lambda: doctor
    try:
        assert client.post("/v1/admin/users", json=payload).status_code == 403
        app.dependency_overrides[get_current_user] = lambda: admin
        r = client.post("/v1/admin/users", json=payload)
        assert r.status_code == 201, r.text
        assert r.json()["roles"] == ["national_admin"]
        assert client.post("/v1/admin/users", json=payload).status_code == 400
        bad = {**payload, "email": _email("bad"), "role": "doctor"}
        assert client.post("/v1/admin/users", json=bad).status_code == 422
    finally:
        app.dependency_overrides.clear()
