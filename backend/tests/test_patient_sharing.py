from __future__ import annotations

from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.api.deps import get_patient_user
from app.models.patient_sharing import PatientAccessEvent, PatientDoctorGrant
from app.models.user import User
from app.services.patient_sharing import decide_grant, require_active_grant, revoke_grant


class _Query:
    def __init__(self, db: "_DB"):
        self.db = db

    def filter(self, *_args):
        return self

    def with_for_update(self):
        return self

    def first(self):
        return self.db.results.pop(0)

    def all(self):
        return self.db.results.pop(0)


class _DB:
    def __init__(self, *results):
        self.results = list(results)
        self.added = []
        self.commits = 0
        self.queried_models = []

    def query(self, _model):
        self.queried_models.append(_model)
        return _Query(self)

    def add(self, item):
        self.added.append(item)

    def commit(self):
        self.commits += 1

    def refresh(self, _item):
        pass


def _grant(status: str = "pending") -> PatientDoctorGrant:
    return PatientDoctorGrant(
        id="grant-1",
        patient_id="patient-1",
        doctor_id="doctor-1",
        status=status,
        created_at=datetime.now(timezone.utc),
    )


def _user(user_id: str, name: str) -> User:
    return User(id=user_id, email=f"{user_id}@example.test", full_name=name, roles=["user"])


@pytest.mark.parametrize("roles", [["user"], ["patient"]])
def test_patient_access_dependency_allows_patient_roles(roles):
    user = SimpleNamespace(id="patient-1", roles=roles)
    assert get_patient_user(user) is user  # type: ignore[arg-type]


@pytest.mark.parametrize("roles", [["doctor"], ["admin", "user"], ["national_admin"]])
def test_patient_access_dependency_rejects_non_patient_roles(roles):
    user = SimpleNamespace(id="other-1", roles=roles)
    with pytest.raises(HTTPException) as exc:
        get_patient_user(user)  # type: ignore[arg-type]
    assert exc.value.status_code == 403


def test_doctor_accepts_only_its_pending_grant_and_audits_acceptance():
    grant = _grant()
    db = _DB(grant, _user("patient-1", "Patient"), _user("doctor-1", "Doctor"))

    result = decide_grant(db, "doctor-1", "grant-1", "accept")

    assert result.status == "active"
    assert grant.responded_at is not None
    assert db.commits == 1
    event = next(row for row in db.added if isinstance(row, PatientAccessEvent))
    assert event.event_type == "grant_accepted"
    assert event.patient_id == "patient-1"
    assert event.actor_id == "doctor-1"


def test_doctor_cannot_respond_to_another_doctors_grant():
    db = _DB(None)
    with pytest.raises(HTTPException) as exc:
        decide_grant(db, "other-doctor", "grant-1", "accept")
    assert exc.value.status_code == 404
    assert db.commits == 0


def test_patient_revocation_closes_grant_and_retains_event():
    grant = _grant("active")
    db = _DB(grant, _user("patient-1", "Patient"), _user("doctor-1", "Doctor"))

    result = revoke_grant(db, "patient-1", "grant-1")

    assert result.status == "revoked"
    assert grant.revoked_at is not None
    assert db.commits == 1
    event = next(row for row in db.added if isinstance(row, PatientAccessEvent))
    assert event.event_type == "grant_revoked"


def test_doctor_without_active_grant_is_denied():
    with pytest.raises(HTTPException) as exc:
        require_active_grant(_DB(None), "doctor-1", "patient-1")  # type: ignore[arg-type]
    assert exc.value.status_code == 404


def test_doctor_dashboard_uses_grants_as_its_authorization_source():
    from app.services.patient_sharing import list_doctor_profiles

    db = _DB([])
    assert list_doctor_profiles(db, "doctor-1") == []
    assert db.queried_models == [PatientDoctorGrant]
