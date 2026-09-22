"""Focused auth / flag gating tests for national deps (no live DB required)."""

from __future__ import annotations

import pytest
from fastapi import HTTPException

from app.api.deps import get_national_admin_user


class _User:
    def __init__(self, roles: list[str]):
        self.roles = roles
        self.id = "u1"


def test_national_admin_allowed():
    assert get_national_admin_user(_User(["national_admin"]))  # type: ignore[arg-type]


def test_admin_allowed():
    assert get_national_admin_user(_User(["admin"]))  # type: ignore[arg-type]


def test_patient_forbidden():
    with pytest.raises(HTTPException) as exc:
        get_national_admin_user(_User(["patient"]))  # type: ignore[arg-type]
    assert exc.value.status_code == 403


def test_doctor_forbidden():
    with pytest.raises(HTTPException) as exc:
        get_national_admin_user(_User(["doctor"]))  # type: ignore[arg-type]
    assert exc.value.status_code == 403
