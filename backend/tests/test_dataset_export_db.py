"""Export endpoints + ingest->export->ingest round trip. Skipped without PostgreSQL."""

from __future__ import annotations

import csv
import io
import uuid
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password
from app.db.base import engine
from app.db.init_db import create_tables
from app.main import app
from app.models.audit import AuditLog
from app.models.record import PatientRecord
from app.models.user import User
from app.services import dataset_columns as dc
from app.services.dataset_ingest import ingest_doctors, ingest_patients
from tests.test_dataset_ingest_db import DOC_EMAIL, _doctor_rows, _patient_rows, _write


def _db_available() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(not _db_available(), reason="PostgreSQL not available")

ADMIN_EMAIL = f"admin-{uuid.uuid4().hex[:6]}{DOC_EMAIL}"


@pytest.fixture()
def db():
    create_tables()
    with Session(engine) as session:
        yield session
        session.rollback()
        session.query(AuditLog).filter(AuditLog.user_email.like(f"%{DOC_EMAIL}")).delete(synchronize_session=False)
        session.query(PatientRecord).filter(PatientRecord.pid.like("TST-%")).delete(synchronize_session=False)
        session.query(User).filter(
            User.email.like(f"%{DOC_EMAIL}") | User.email.like("tst-%@patient.example.bd")
        ).delete(synchronize_session=False)
        session.commit()


def _user(db, roles) -> tuple[User, dict]:
    u = User(
        email=f"{roles[0]}-{uuid.uuid4().hex[:6]}{DOC_EMAIL}",
        password_hash=hash_password("x-test-pass-1"),
        full_name="T",
        is_active=True,
        roles=roles,
    )
    db.add(u)
    db.commit()
    return u, {"Authorization": f"Bearer {create_access_token(u.id, roles)}"}


def _parse(body: str) -> list[dict]:
    return list(csv.DictReader(io.StringIO(body)))


@pytest.fixture()
def client():
    return TestClient(app)


def test_export_requires_admin(db, client):
    _, patient_h = _user(db, ["patient"])
    for path in ("/v1/admin/export/doctors.csv", "/v1/admin/export/patients.csv"):
        assert client.get(path).status_code == 401
        assert client.get(path, headers=patient_h).status_code == 403
    assert db.query(AuditLog).filter(AuditLog.action.like("export_%")).filter(
        AuditLog.user_email.like(f"patient-%{DOC_EMAIL}")
    ).count() == 0


def test_doctor_export_content_headers_and_audit(db, client, tmp_path):
    rows = _doctor_rows(3)
    ingest_doctors(db, _write(tmp_path / "d.csv", rows))
    admin, h = _user(db, ["admin"])

    r = client.get("/v1/admin/export/doctors.csv", headers=h)
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("text/csv")
    assert "attachment" in r.headers["content-disposition"]
    assert r.headers["cache-control"] == "no-store"
    assert "password" not in r.text.splitlines()[0]
    assert "$synthetic$" not in r.text and "!" not in r.text.splitlines()[0]

    got = {x["id"]: x for x in _parse(r.text)}
    for src in rows:
        out = got[src["id"]]
        assert out["email"] == src["email"].lower()
        assert out["division"] == src["division"]  # CSV spelling restored on export
    entry = db.query(AuditLog).filter_by(user_id=admin.id, action="export_doctors").one()
    assert entry.entity_type == "doctor_dataset"


def test_patient_export_round_trip(db, client, tmp_path):
    rows = _patient_rows(8)
    ingest_patients(db, _write(tmp_path / "p.csv", rows))
    admin, h = _user(db, ["admin"])

    r = client.get("/v1/admin/export/patients.csv", headers=h)
    assert r.status_code == 200
    exported = [x for x in _parse(r.text) if x["pid"].startswith("TST-")]
    assert {x["pid"] for x in exported} == {x["pid"] for x in rows}
    assert db.query(AuditLog).filter_by(user_id=admin.id, action="export_patients").count() == 1

    # wipe, re-ingest the exported file, compare every imported field
    db.query(PatientRecord).filter(PatientRecord.pid.like("TST-%")).delete(synchronize_session=False)
    db.commit()
    rep = ingest_patients(db, _write(tmp_path / "again.csv", exported))
    assert (rep.inserted, rep.rejected) == (8, [])
    by_pid = {x["pid"]: x for x in rows}
    for rec in db.query(PatientRecord).filter(PatientRecord.pid.like("TST-%")).all():
        src, _ = dc.parse_row(dc.PATIENT_COLUMNS, by_pid[rec.pid])
        for col in dc.PATIENT_COLUMNS:
            assert getattr(rec, col.name) == src[col.name], (rec.pid, col.name)


def test_formula_values_neutralized_and_restored(db, client, tmp_path):
    rows = _patient_rows(1)
    rows[0]["diagnosis"] = "=HYPERLINK(\"http://x\")"
    ingest_patients(db, _write(tmp_path / "p.csv", rows))
    _, h = _user(db, ["admin"])
    r = client.get("/v1/admin/export/patients.csv", headers=h)
    cell = next(x for x in _parse(r.text) if x["pid"] == rows[0]["pid"])["diagnosis"]
    assert cell.startswith("'=")
    assert dc.parse_str_opt(cell) == rows[0]["diagnosis"]
