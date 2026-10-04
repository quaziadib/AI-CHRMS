"""DB-backed tests for dataset ingestion. Skipped when PostgreSQL is unreachable.

Uses temp CSVs with throwaway ids/pids (TST-*) and removes everything it creates.
"""

from __future__ import annotations

import csv
import uuid
from pathlib import Path

import pytest
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import UNUSABLE_PASSWORD_HASH, verify_password
from app.db.base import engine
from app.db.init_db import create_tables
from app.models.doctor_profile import DoctorProfile
from app.models.record import PatientRecord
from app.models.user import User
from app.scripts import ingest_datasets as cli
from app.services import dataset_columns as dc
from app.services.dataset_ingest import DatasetFileError, ingest_doctors, ingest_patients

SEED = Path(__file__).resolve().parent.parent / "app" / "data" / "seed"
DOC_EMAIL = "@ingest-test.example.bd"


def _db_available() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(not _db_available(), reason="PostgreSQL not available")


def _seed_rows(name: str) -> list[dict]:
    with open(SEED / name, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def _write(path: Path, rows: list[dict]) -> Path:
    with open(path, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    return path


def _doctor_rows(n: int) -> list[dict]:
    rows = []
    for i, r in enumerate(_seed_rows("doctors_100.csv")[:n]):
        rows.append(dict(r, id=str(uuid.uuid4()), email=f"t{i}-{uuid.uuid4().hex[:6]}{DOC_EMAIL}"))
    return rows


def _patient_rows(n: int) -> list[dict]:
    tag = uuid.uuid4().hex[:6].upper()
    rows = []
    for i, r in enumerate(_seed_rows("patients_1000.csv")[:n]):
        rows.append(dict(r, id=str(uuid.uuid4()), user_id=str(uuid.uuid4()), pid=f"TST-{tag}-{i:03d}"))
    return rows


@pytest.fixture()
def db():
    create_tables()
    with Session(engine) as session:
        yield session
        session.rollback()
        session.query(PatientRecord).filter(PatientRecord.pid.like("TST-%")).delete(synchronize_session=False)
        session.query(User).filter(
            User.email.like(f"%{DOC_EMAIL}") | User.email.like("tst-%@patient.example.bd")
        ).delete(synchronize_session=False)
        session.commit()


# --- doctors ----------------------------------------------------------------


def test_doctors_insert_then_rerun_is_noop(db, tmp_path):
    rows = _doctor_rows(5)
    path = _write(tmp_path / "d.csv", rows)

    first = ingest_doctors(db, path)
    assert (first.inserted, first.updated, first.rejected) == (5, 0, [])
    again = ingest_doctors(db, path)
    assert (again.inserted, again.updated, again.unchanged) == (0, 0, 5)

    u = db.get(User, rows[0]["id"])
    assert u.roles == ["doctor"] and u.password_hash == UNUSABLE_PASSWORD_HASH
    assert verify_password("anything", u.password_hash) is False
    p = db.get(DoctorProfile, rows[0]["id"])
    assert p.division.endswith("Division")
    assert db.query(DoctorProfile).filter(DoctorProfile.user_id.in_([r["id"] for r in rows])).count() == 5


def test_doctors_update_changes_fields_not_credentials(db, tmp_path):
    rows = _doctor_rows(1)
    ingest_doctors(db, _write(tmp_path / "d.csv", rows))
    db.get(User, rows[0]["id"]).password_hash = "kept-as-is"
    db.commit()

    rows[0]["specialization"] = "Neurology"
    rep = ingest_doctors(db, _write(tmp_path / "d2.csv", rows))
    assert (rep.inserted, rep.updated) == (0, 1)
    db.expire_all()
    assert db.get(DoctorProfile, rows[0]["id"]).specialization == "Neurology"
    assert db.get(User, rows[0]["id"]).password_hash == "kept-as-is"


def test_doctor_email_owned_by_other_account_rejected(db, tmp_path):
    rows = _doctor_rows(2)
    ingest_doctors(db, _write(tmp_path / "a.csv", rows[:1]))
    clash = dict(rows[1], email=rows[0]["email"])
    rep = ingest_doctors(db, _write(tmp_path / "b.csv", [clash]))
    assert rep.inserted == 0 and len(rep.rejected) == 1
    assert "email" in rep.rejected[0][1]
    assert db.get(User, clash["id"]) is None
    assert db.get(User, rows[0]["id"]).full_name == rows[0]["name"]


def test_bad_doctor_rows_rejected_valid_rows_load(db, tmp_path):
    rows = _doctor_rows(3)
    rows[1]["email"] = "not-an-email"
    rows[2]["specialization"] = ""
    rep = ingest_doctors(db, _write(tmp_path / "d.csv", rows))
    assert rep.inserted == 1
    assert sorted(line for line, _ in rep.rejected) == [3, 4]


def test_doctor_dry_run_writes_nothing(db, tmp_path):
    rows = _doctor_rows(3)
    rep = ingest_doctors(db, _write(tmp_path / "d.csv", rows), dry_run=True)
    assert rep.inserted == 3 and rep.dry_run
    assert db.query(User).filter(User.id.in_([r["id"] for r in rows])).count() == 0


# --- patients ---------------------------------------------------------------


def test_patients_insert_with_stub_accounts_then_rerun(db, tmp_path):
    rows = _patient_rows(6)
    path = _write(tmp_path / "p.csv", rows)

    first = ingest_patients(db, path)
    assert (first.inserted, first.rejected) == (6, [])
    again = ingest_patients(db, path)
    assert (again.inserted, again.updated, again.unchanged) == (0, 0, 6)

    rec = db.query(PatientRecord).filter_by(pid=rows[0]["pid"]).one()
    assert rec.id == rows[0]["id"] and rec.flags is not None
    stub = db.get(User, rows[0]["user_id"])
    assert stub.roles == ["patient"] and stub.is_active is False
    assert stub.password_hash == UNUSABLE_PASSWORD_HASH
    assert stub.email == f"{rows[0]['pid'].lower()}@patient.example.bd"


def test_blank_optionals_stored_as_null(db, tmp_path):
    row = next(r for r in _patient_rows(60) if r["allergies"] == "" and r["pregnancies"] == "")
    ingest_patients(db, _write(tmp_path / "p.csv", [row]))
    rec = db.query(PatientRecord).filter_by(pid=row["pid"]).one()
    assert rec.allergies is None and rec.pregnancies is None


def test_update_preserves_assigned_doctor_and_risk(db, tmp_path):
    doc = _doctor_rows(1)
    ingest_doctors(db, _write(tmp_path / "d.csv", doc))
    rows = _patient_rows(1)
    path = _write(tmp_path / "p.csv", rows)
    ingest_patients(db, path)

    rec = db.query(PatientRecord).filter_by(pid=rows[0]["pid"]).one()
    rec.doctor_id = doc[0]["id"]
    rec.risk_level = "high"
    rec.risk_explanation = "kept"
    db.commit()

    rows[0]["age"] = str(int(rows[0]["age"]) + 1)
    rep = ingest_patients(db, _write(tmp_path / "p2.csv", rows))
    assert (rep.inserted, rep.updated) == (0, 1)
    db.expire_all()
    rec = db.query(PatientRecord).filter_by(pid=rows[0]["pid"]).one()
    assert rec.age == int(rows[0]["age"])
    assert (rec.doctor_id, rec.risk_level, rec.risk_explanation) == (doc[0]["id"], "high", "kept")


def test_bad_patient_rows_rejected_with_line_numbers(db, tmp_path):
    rows = _patient_rows(4)
    rows[0]["age"] = "abc"
    rows[2]["pid"] = ""
    rows[3]["age"] = "999"  # out of schema range
    rep = ingest_patients(db, _write(tmp_path / "p.csv", rows))
    assert rep.inserted == 1
    assert sorted(line for line, _ in rep.rejected) == [2, 4, 5]
    assert db.query(PatientRecord).filter_by(pid=rows[1]["pid"]).count() == 1


def test_patient_dry_run_writes_nothing(db, tmp_path):
    rows = _patient_rows(3)
    rep = ingest_patients(db, _write(tmp_path / "p.csv", rows), dry_run=True)
    assert rep.inserted == 3
    assert db.query(PatientRecord).filter(PatientRecord.pid.in_([r["pid"] for r in rows])).count() == 0
    assert db.query(User).filter(User.id.in_([r["user_id"] for r in rows])).count() == 0


# --- files & CLI ------------------------------------------------------------


def test_missing_file_and_missing_column(db, tmp_path):
    with pytest.raises(DatasetFileError):
        ingest_patients(db, tmp_path / "nope.csv")
    bad = tmp_path / "bad.csv"
    bad.write_text("id,name\n1,x\n")
    with pytest.raises(DatasetFileError, match="missing columns"):
        ingest_doctors(db, bad)


def test_cli_missing_file_exits_nonzero_and_changes_nothing(tmp_path, capsys):
    code = cli.main(["--doctors", str(tmp_path / "x.csv"), "--patients", str(tmp_path / "y.csv")])
    assert code == 2
    assert "ERROR" in capsys.readouterr().err


def test_cli_dry_run_reports_and_writes_nothing(db, tmp_path, capsys):
    drows, prows = _doctor_rows(2), _patient_rows(2)
    code = cli.main([
        "--dry-run",
        "--doctors", str(_write(tmp_path / "d.csv", drows)),
        "--patients", str(_write(tmp_path / "p.csv", prows)),
    ])
    out = capsys.readouterr().out
    assert code == 0 and "DRY RUN" in out and "inserted=2" in out and "host=" in out
    assert "@" not in out.split("Target database:")[1].splitlines()[0]  # no credentials
    assert db.query(PatientRecord).filter(PatientRecord.pid.in_([r["pid"] for r in prows])).count() == 0


def test_round_trip_columns_cover_model():
    # every patient column maps to a real model attribute
    for c in dc.PATIENT_COLUMNS:
        assert hasattr(PatientRecord, c.name), c.name
