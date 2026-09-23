"""Seed 50 synthetic demo patients with 10 assessments + chat history each."""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models.conversation import ConversationMessage
from app.models.health_snapshot import HealthSnapshot
from app.models.record import PatientRecord
from app.models.user import User
from app.services.flagging import compute_flags

logger = logging.getLogger(__name__)

_DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "synthetic"


def _months_ago(base: datetime, months: int) -> datetime:
    """Shift `base` by `months` (positive = past, negative = future)."""
    month = base.month - months
    year = base.year
    while month <= 0:
        month += 12
        year -= 1
    while month > 12:
        month -= 12
        year += 1
    day = min(base.day, 28)
    return base.replace(year=year, month=month, day=day, tzinfo=timezone.utc)


def _height_cm(raw: float) -> float:
    """Synthetic dataset stores height in metres; app expects centimetres."""
    return raw * 100.0 if raw < 3.0 else raw


def _load_json(name: str) -> list | dict:
    path = _DATA_DIR / name
    if not path.exists():
        raise FileNotFoundError(
            f"{path} not found. Run: python backend/scripts/build_synthetic_dataset.py"
        )
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _already_seeded(db: Session) -> bool:
    return db.query(User).filter(User.email == "patient001@health.local").first() is not None


def seed_synthetic_data(db: Session, *, force: bool = False) -> dict:
    """Insert demo users, records, snapshots, and chat history."""
    if force:
        _purge_synthetic(db)
    elif _already_seeded(db):
        logger.info("Synthetic seed skipped — patient001@health.local already exists")
        return {"skipped": True}

    users_data = _load_json("users.json")
    records_data = _load_json("records.json")
    conversations_data = _load_json("conversations.json")

    email_to_id: dict[str, str] = {}
    now = datetime.now(timezone.utc)
    # Dataset offsets can include 0 / negative values. Shift so the newest submission is
    # at least one resubmit-interval in the past — otherwise demo patients cannot submit.
    interval = settings.RESUBMIT_INTERVAL_MONTHS_DEFAULT
    newest_offset = min(
        (int(r.get("created_at_offset_months", 0)) for r in records_data),
        default=0,
    )
    offset_shift = max(0, interval - newest_offset)

    for u in users_data:
        user = User(
            email=u["email"],
            password_hash=hash_password(u["password"]),
            full_name=u["full_name"],
            phone=u.get("phone"),
            roles=u["roles"],
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        db.flush()
        email_to_id[u["email"]] = user.id

    records_created = 0
    for rec in records_data:
        user_id = email_to_id[rec["user_email"]]
        months_ago = int(rec.get("created_at_offset_months", 0)) + offset_shift
        created_at = _months_ago(now, months_ago)

        record = PatientRecord(
            user_id=user_id,
            pid=rec["pid"],
            age=rec["age"],
            gender=rec["gender"],
            district=rec["district"],
            family_diabetes=rec["family_diabetes"],
            family_hypertension=rec["family_hypertension"],
            family_cvd=rec["family_cvd"],
            family_stroke=rec["family_stroke"],
            diabetes_history=rec["diabetes_history"],
            hypertension=rec["hypertension"],
            cvd=rec["cvd"],
            stroke=rec["stroke"],
            allergies=rec.get("allergies"),
            pregnancies=rec.get("pregnancies"),
            bp_systolic=rec["bp_systolic"],
            bp_diastolic=rec["bp_diastolic"],
            height=_height_cm(rec["height"]),
            weight=rec["weight"],
            bmi=rec["bmi"],
            pulse_rate=rec["pulse_rate"],
            blood_glucose=rec.get("blood_glucose"),
            cholesterol=rec.get("cholesterol"),
            hemoglobin=rec.get("hemoglobin"),
            creatinine=rec.get("creatinine"),
            ecg_result=rec.get("ecg_result"),
            symptoms=rec.get("symptoms"),
            diagnosis=rec.get("diagnosis"),
            smoking=rec["smoking"],
            physical_activity=rec["physical_activity"],
            alcohol=rec["alcohol"],
            sleep_hours=rec["sleep_hours"],
            sound_sleep=rec["sound_sleep"],
            risk_level=rec["risk_level"],
            risk_explanation=rec["risk_explanation"],
            recommendations=rec["recommendations"],
            risk_scored_at=created_at,
            created_at=created_at,
            updated_at=created_at,
        )
        record.flags = compute_flags(record)
        db.add(record)
        db.flush()
        # Add snapshot without committing — final db.commit() persists everything atomically.
        db.add(
            HealthSnapshot(
                record_id=record.id,
                blood_glucose=record.blood_glucose,
                bmi=record.bmi,
            )
        )
        records_created += 1

    messages_created = 0
    for conv in conversations_data:
        user_id = email_to_id[conv["user_email"]]
        base = now - timedelta(days=7)
        for msg in conv["messages"]:
            created = base + timedelta(minutes=msg.get("offset_minutes", 0))
            db.add(
                ConversationMessage(
                    user_id=user_id,
                    role=msg["role"],
                    content=msg["content"],
                    created_at=created,
                )
            )
            messages_created += 1

    db.commit()

    if settings.ENABLE_NATIONAL_ANALYTICS:
        try:
            from app.services.national_aggregate import backfill_all_snapshots

            backfill_all_snapshots(db)
        except ImportError:
            logger.info("Skipping national aggregate backfill (module not present)")
        except Exception:
            logger.exception("National aggregate backfill failed after synthetic seed")

    logger.info(
        "Synthetic seed complete: %d users, %d records, %d messages",
        len(users_data),
        records_created,
        messages_created,
    )
    return {
        "skipped": False,
        "users": len(users_data),
        "records": records_created,
        "messages": messages_created,
    }


def _purge_synthetic(db: Session) -> None:
    """Remove previously seeded patientNNN@health.local users and their records.

    PatientRecord.user_id has no FK cascade, so records (and PID uniqueness) must be
    cleared explicitly. HealthSnapshot rows cascade from patient_records.
    """
    users = db.query(User).filter(User.email.like("patient%@health.local")).all()
    user_ids = [u.id for u in users]
    records_deleted = 0
    if user_ids:
        records_deleted = (
            db.query(PatientRecord)
            .filter(PatientRecord.user_id.in_(user_ids))
            .delete(synchronize_session=False)
        )
    # Orphans from earlier force runs that deleted users but left synthetic PIDs
    # (format PID-NNN-MM). Do not use PID-% — live generate_pid() values share that prefix.
    orphans = (
        db.query(PatientRecord)
        .filter(PatientRecord.pid.like("PID-___-__"))
        .delete(synchronize_session=False)
    )
    for user in users:
        db.delete(user)
    db.commit()
    logger.info(
        "Purged %d synthetic users, %d records (+ %d orphan PID rows)",
        len(users),
        records_deleted,
        orphans,
    )


if __name__ == "__main__":
    import sys

    from app.db.session import SessionLocal

    logging.basicConfig(level=logging.INFO)
    db = SessionLocal()
    try:
        force = "--force" in sys.argv
        result = seed_synthetic_data(db, force=force)
        print(result)
    finally:
        db.close()
