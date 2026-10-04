"""Idempotent CSV ingestion of the doctor and patient datasets.

Each file is loaded in a single transaction: bad rows are rejected up front with a
reason and never abort valid rows, while a failure mid-file rolls the whole file back.
``dry_run`` runs the full flow and rolls back, so counts match a real run exactly.
"""

from __future__ import annotations

import csv
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from pydantic import EmailStr, TypeAdapter, ValidationError
from sqlalchemy.orm import Session

import app.models  # noqa: F401 — register all mappers
from app.core.security import UNUSABLE_PASSWORD_HASH
from app.models.doctor_profile import DoctorProfile
from app.models.record import PatientRecord
from app.models.user import User
from app.schemas.record import PatientRecordCreate
from app.services import dataset_columns as dc
from app.services.bd_geo import DIVISIONS
from app.services.flagging import compute_flags

logger = logging.getLogger(__name__)

PATIENT_EMAIL_DOMAIN = "patient.example.bd"
_email_adapter = TypeAdapter(EmailStr)
_KNOWN_DIVISIONS = {d["name"] for d in DIVISIONS}

# Fields on an existing record that ingestion must never overwrite.
_PATIENT_KEY_FIELDS = {"id", "user_id", "pid"}


class DatasetFileError(Exception):
    """File missing, unreadable, or structurally invalid — nothing was written."""


@dataclass
class FileReport:
    name: str
    inserted: int = 0
    updated: int = 0
    unchanged: int = 0
    rejected: list[tuple[int, str]] = field(default_factory=list)  # (csv line, reason)
    warnings: list[str] = field(default_factory=list)
    dry_run: bool = False

    def summary(self) -> str:
        tag = " [dry-run]" if self.dry_run else ""
        return (
            f"{self.name}{tag}: inserted={self.inserted} updated={self.updated} "
            f"unchanged={self.unchanged} rejected={len(self.rejected)}"
        )


def _read_rows(path: Path, columns: list[dc.Column]) -> list[tuple[int, dict[str, str]]]:
    try:
        f = open(path, encoding="utf-8-sig", newline="")
    except OSError as exc:
        raise DatasetFileError(f"cannot read {path}: {exc.strerror or exc}") from exc
    with f:
        try:
            reader = csv.DictReader(f)
            missing = dc.check_header(columns, reader.fieldnames)
            if missing:
                raise DatasetFileError(f"{path.name}: missing columns {', '.join(missing)}")
            # header is line 1, first data row is line 2
            return [(i, row) for i, row in enumerate(reader, start=2)]
        except csv.Error as exc:
            raise DatasetFileError(f"{path.name}: malformed CSV: {exc}") from exc


def _finish(db: Session, report: FileReport, dry_run: bool) -> FileReport:
    if dry_run:
        db.rollback()
    else:
        db.commit()
    return report


# --- doctors ----------------------------------------------------------------


def ingest_doctors(db: Session, path: Path, *, dry_run: bool = False) -> FileReport:
    report = FileReport(name=path.name, dry_run=dry_run)
    raw_rows = _read_rows(path, dc.DOCTOR_IMPORT_COLUMNS)

    valid: list[tuple[int, dict[str, Any]]] = []
    seen_ids: set[str] = set()
    seen_emails: set[str] = set()
    for line, raw in raw_rows:
        values, errors = dc.parse_row(dc.DOCTOR_IMPORT_COLUMNS, raw)
        if not errors:
            try:
                _email_adapter.validate_python(values["email"])
            except ValidationError:
                errors.append(f"email: invalid address {values['email']!r}")
        if not errors and values["id"] in seen_ids:
            errors.append(f"id: duplicate within file {values['id']}")
        if not errors and values["email"] in seen_emails:
            errors.append(f"email: duplicate within file {values['email']}")
        if errors:
            report.rejected.append((line, "; ".join(errors)))
            continue
        seen_ids.add(values["id"])
        seen_emails.add(values["email"])
        if values["division"] not in _KNOWN_DIVISIONS:
            report.warnings.append(f"line {line}: unknown division {values['division']!r}")
        valid.append((line, values))

    try:
        ids = [v["id"] for _, v in valid]
        emails = [v["email"] for _, v in valid]
        by_id = {u.id: u for u in db.query(User).filter(User.id.in_(ids)).all()} if ids else {}
        by_email = (
            {u.email: u for u in db.query(User).filter(User.email.in_(emails)).all()} if emails else {}
        )

        for line, v in valid:
            existing = by_id.get(v["id"])
            owner = by_email.get(v["email"])
            if owner is not None and (existing is None or owner.id != existing.id):
                report.rejected.append((line, f"email: already used by another account ({v['email']})"))
                continue

            if existing is None:
                user = User(
                    id=v["id"],
                    email=v["email"],
                    password_hash=UNUSABLE_PASSWORD_HASH,
                    full_name=v["name"],
                    phone=v["phone"],
                    is_active=v["is_active"],
                    is_verified=v["is_verified"],
                    roles=["doctor"],
                )
                user.doctor_profile = DoctorProfile(
                    specialization=v["specialization"],
                    affiliations=v["affiliations"],
                    division=v["division"],
                    district=v["district"],
                    location=v["location"],
                    id_pic=v["id_pic"],
                )
                db.add(user)
                report.inserted += 1
                continue

            # Update in place; credentials and requested-role state are never touched.
            existing.email = v["email"]
            existing.full_name = v["name"]
            existing.phone = v["phone"]
            existing.is_active = v["is_active"]
            existing.is_verified = v["is_verified"]
            if "doctor" not in (existing.roles or []):
                existing.roles = [*(existing.roles or []), "doctor"]
            profile = existing.doctor_profile
            if profile is None:
                profile = DoctorProfile(user_id=existing.id)
                existing.doctor_profile = profile
            profile.specialization = v["specialization"]
            profile.affiliations = v["affiliations"]
            profile.division = v["division"]
            profile.district = v["district"]
            profile.location = v["location"]
            profile.id_pic = v["id_pic"]
            if db.is_modified(existing) or db.is_modified(profile):
                report.updated += 1
            else:
                report.unchanged += 1

        db.flush()
    except Exception:
        db.rollback()
        raise
    return _finish(db, report, dry_run)


# --- patients ---------------------------------------------------------------


def ingest_patients(db: Session, path: Path, *, dry_run: bool = False) -> FileReport:
    report = FileReport(name=path.name, dry_run=dry_run)
    raw_rows = _read_rows(path, dc.PATIENT_COLUMNS)

    valid: list[tuple[int, dict[str, Any]]] = []
    seen_ids: set[str] = set()
    seen_pids: set[str] = set()
    for line, raw in raw_rows:
        values, errors = dc.parse_row(dc.PATIENT_COLUMNS, raw)
        if not errors:
            try:
                PatientRecordCreate(**{k: v for k, v in values.items() if k not in _PATIENT_KEY_FIELDS})
            except ValidationError as exc:
                errors.extend(f"{'.'.join(map(str, e['loc']))}: {e['msg']}" for e in exc.errors())
        if not errors and values["pid"] in seen_pids:
            errors.append(f"pid: duplicate within file {values['pid']}")
        if not errors and values["id"] in seen_ids:
            errors.append(f"id: duplicate within file {values['id']}")
        if errors:
            report.rejected.append((line, "; ".join(errors)))
            continue
        seen_pids.add(values["pid"])
        seen_ids.add(values["id"])
        valid.append((line, values))

    try:
        pids = [v["pid"] for _, v in valid]
        ids = [v["id"] for _, v in valid]
        user_ids = list({v["user_id"] for _, v in valid})
        rec_by_pid = (
            {r.pid: r for r in db.query(PatientRecord).filter(PatientRecord.pid.in_(pids)).all()}
            if pids
            else {}
        )
        rec_ids = (
            {r.id: r.pid for r in db.query(PatientRecord).filter(PatientRecord.id.in_(ids)).all()}
            if ids
            else {}
        )
        existing_users = (
            {u.id for u in db.query(User.id).filter(User.id.in_(user_ids)).all()} if user_ids else set()
        )
        taken_emails = {
            e for (e,) in db.query(User.email).filter(User.email.like(f"%@{PATIENT_EMAIL_DOMAIN}")).all()
        }

        for line, v in valid:
            fields = {k: val for k, val in v.items() if k not in _PATIENT_KEY_FIELDS}
            record = rec_by_pid.get(v["pid"])

            if record is not None:
                # Never touches doctor_id, risk fields, EHR summary or personalized plan.
                for k, val in fields.items():
                    setattr(record, k, val)
                record.flags = compute_flags(record)
                if db.is_modified(record):
                    report.updated += 1
                else:
                    report.unchanged += 1
                continue

            if v["id"] in rec_ids:
                report.rejected.append(
                    (line, f"id: already used by record {rec_ids[v['id']]}, not {v['pid']}")
                )
                continue

            if v["user_id"] not in existing_users:
                email = f"{v['pid'].lower()}@{PATIENT_EMAIL_DOMAIN}"
                if email in taken_emails:
                    report.rejected.append((line, f"email: stub account email taken ({email})"))
                    continue
                db.add(
                    User(
                        id=v["user_id"],
                        email=email,
                        password_hash=UNUSABLE_PASSWORD_HASH,
                        full_name=v["pid"],
                        is_active=False,
                        is_verified=False,
                        roles=["patient"],
                    )
                )
                existing_users.add(v["user_id"])
                taken_emails.add(email)

            record = PatientRecord(id=v["id"], user_id=v["user_id"], pid=v["pid"], **fields)
            record.flags = compute_flags(record)
            db.add(record)
            report.inserted += 1

        db.flush()
    except Exception:
        db.rollback()
        raise
    return _finish(db, report, dry_run)
