"""Unit tests for signup role selection and admin approval (no live DB)."""

from __future__ import annotations

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.api.deps import get_admin_user, get_doctor_user
from app.schemas.user import UserCreate, roles_for_approved_signup


class _User:
    def __init__(self, roles: list[str], *, id: str = "u1"):
        self.roles = roles
        self.id = id
        self.is_active = True


def test_user_create_defaults_to_patient():
    data = UserCreate(
        email="a@example.com",
        password="password1",
        full_name="Ada Lovelace",
    )
    assert data.role == "user"


def test_user_create_accepts_elevated_roles():
    for role in ("national_admin", "admin"):
        data = UserCreate(
            email=f"{role}@example.com",
            password="password1",
            full_name="Name",
            role=role,  # type: ignore[arg-type]
        )
        assert data.role == role


_DOCTOR_PROFILE = {
    "specialization": "Endocrinology",
    "division": "Dhaka Division",
    "district": "Dhaka",
    "location": "Shahbag, Dhaka",
}


def test_doctor_signup_requires_profile():
    with pytest.raises(ValidationError):
        UserCreate(email="d@example.com", password="password1", full_name="Dr D", role="doctor")
    data = UserCreate(
        email="d@example.com", password="password1", full_name="Dr D", role="doctor",
        doctor_profile=_DOCTOR_PROFILE,  # type: ignore[arg-type]
    )
    assert data.doctor_profile and data.doctor_profile.affiliations == []


def test_doctor_signup_rejects_missing_profile_field():
    incomplete = {k: v for k, v in _DOCTOR_PROFILE.items() if k != "district"}
    with pytest.raises(ValidationError):
        UserCreate(
            email="d@example.com", password="password1", full_name="Dr D", role="doctor",
            doctor_profile=incomplete,  # type: ignore[arg-type]
        )


@pytest.mark.parametrize("role", ["user", "national_admin", "admin"])
def test_non_doctor_signup_rejects_profile(role):
    with pytest.raises(ValidationError):
        UserCreate(
            email="x@example.com", password="password1", full_name="Name", role=role,  # type: ignore[arg-type]
            doctor_profile=_DOCTOR_PROFILE,  # type: ignore[arg-type]
        )


def test_user_create_rejects_invalid_role():
    with pytest.raises(ValidationError):
        UserCreate(
            email="x@example.com",
            password="password1",
            full_name="Name",
            role="superuser",  # type: ignore[arg-type]
        )


def test_roles_for_approved_signup():
    assert roles_for_approved_signup("doctor") == ["doctor"]
    assert roles_for_approved_signup("national_admin") == ["national_admin"]
    assert roles_for_approved_signup("admin") == ["admin", "user"]
    assert roles_for_approved_signup("user") == ["user"]


def test_pending_doctor_fails_doctor_dep():
    with pytest.raises(HTTPException) as exc:
        get_doctor_user(_User(["user"]))  # type: ignore[arg-type]
    assert exc.value.status_code == 403


def test_approved_doctor_passes_doctor_dep():
    assert get_doctor_user(_User(["doctor"]))  # type: ignore[arg-type]


def test_non_admin_forbidden_for_admin_dep():
    with pytest.raises(HTTPException) as exc:
        get_admin_user(_User(["user"]))  # type: ignore[arg-type]
    assert exc.value.status_code == 403


def test_admin_passes_admin_dep():
    assert get_admin_user(_User(["admin", "user"]))  # type: ignore[arg-type]
