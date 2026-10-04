"""Streaming CSV export of the doctor and patient datasets.

Columns come from dataset_columns, the same spec ingestion parses with, so an exported
file can be re-ingested. Rows are streamed in batches on their own database session
(the request-scoped session may be closed before a streamed body finishes).
"""

from __future__ import annotations

import csv
import io
from collections.abc import Iterator
from typing import Any

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.doctor_profile import DoctorProfile
from app.models.record import PatientRecord
from app.models.user import User
from app.services import dataset_columns as dc

BATCH_SIZE = 200


def _csv_line(cells: list[str]) -> str:
    buf = io.StringIO()
    csv.writer(buf, lineterminator="\n").writerow(cells)
    return buf.getvalue()


def _stream(columns: list[dc.Column], rows: Iterator[dict[str, Any]]) -> Iterator[str]:
    yield _csv_line([c.name for c in columns])
    batch: list[str] = []
    for values in rows:
        batch.append(_csv_line(dc.format_row(columns, values)))
        if len(batch) >= BATCH_SIZE:
            yield "".join(batch)
            batch = []
    if batch:
        yield "".join(batch)


def _doctor_rows(db: Session) -> Iterator[dict[str, Any]]:
    q = (
        db.query(User, DoctorProfile)
        .join(DoctorProfile, DoctorProfile.user_id == User.id)
        .order_by(User.email)
        .yield_per(BATCH_SIZE)
    )
    for user, profile in q:
        yield {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "id_pic": profile.id_pic,
            "specialization": profile.specialization,
            "affiliations": profile.affiliations,
            "division": profile.division,
            "district": profile.district,
            "location": profile.location,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
        }


def _patient_rows(db: Session) -> Iterator[dict[str, Any]]:
    names = [c.name for c in dc.PATIENT_COLUMNS]
    for rec in db.query(PatientRecord).order_by(PatientRecord.pid).yield_per(BATCH_SIZE):
        yield {n: getattr(rec, n) for n in names}


def _with_session(columns: list[dc.Column], make_rows) -> Iterator[str]:
    db = SessionLocal()
    try:
        yield from _stream(columns, make_rows(db))
    finally:
        db.close()


def stream_doctors_csv() -> Iterator[str]:
    return _with_session(dc.DOCTOR_EXPORT_COLUMNS, _doctor_rows)


def stream_patients_csv() -> Iterator[str]:
    return _with_session(dc.PATIENT_COLUMNS, _patient_rows)
