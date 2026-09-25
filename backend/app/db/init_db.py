import logging

from sqlalchemy import text
from sqlalchemy.orm import Session

import app.models  # noqa: F401 — registers all models with Base so create_all sees them
from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base, engine
from app.models.user import User

logger = logging.getLogger(__name__)


def _ensure_pgvector() -> None:
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
    logger.info("pgvector extension verified")


def _run_migrations() -> None:
    with engine.connect() as conn:
        # Ensure doctor_id column exists as UUID (convert VARCHAR→UUID if needed)
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'patient_records' AND column_name = 'doctor_id'
                ) THEN
                    ALTER TABLE patient_records ADD COLUMN doctor_id UUID;
                ELSIF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'patient_records' AND column_name = 'doctor_id'
                      AND data_type = 'character varying'
                ) THEN
                    ALTER TABLE patient_records
                        ALTER COLUMN doctor_id TYPE UUID
                        USING NULLIF(doctor_id, '')::UUID;
                END IF;
            END
            $$;
        """))
        conn.execute(text(
            "CREATE INDEX IF NOT EXISTS ix_patient_records_doctor_id "
            "ON patient_records (doctor_id)"
        ))
        conn.execute(text("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'fk_patient_records_doctor_id'
                ) THEN
                    ALTER TABLE patient_records
                        ADD CONSTRAINT fk_patient_records_doctor_id
                        FOREIGN KEY (doctor_id)
                        REFERENCES users(id)
                        ON DELETE SET NULL
                        NOT VALID;
                END IF;
            END
            $$;
        """))
        # Risk assessment columns (added after initial patient_records schema)
        conn.execute(text(
            "ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS risk_level VARCHAR(10)"
        ))
        conn.execute(text(
            "ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS risk_explanation TEXT"
        ))
        conn.execute(text(
            "ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS recommendations JSONB"
        ))
        conn.execute(text(
            "ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS risk_scored_at TIMESTAMPTZ"
        ))
        conn.execute(text(
            "ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS ehr_summary TEXT"
        ))
        conn.execute(text(
            "ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS ehr_summary_at TIMESTAMPTZ"
        ))
        conn.execute(text(
            "ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS flags JSONB"
        ))
        conn.execute(text(
            "ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS personalized_plan JSONB"
        ))
        conn.execute(text(
            "ALTER TABLE patient_records ADD COLUMN IF NOT EXISTS personalized_plan_at TIMESTAMPTZ"
        ))
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS requested_role VARCHAR(32)"
        ))
        conn.execute(text(
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS role_request_status VARCHAR(32)"
        ))
        conn.execute(text("""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.tables
                    WHERE table_name = 'record_embeddings'
                ) THEN
                    CREATE INDEX IF NOT EXISTS ix_record_embeddings_embedding_ivfflat
                    ON record_embeddings USING ivfflat (embedding vector_cosine_ops)
                    WITH (lists = 100);
                END IF;
            END
            $$;
        """))
        conn.commit()
    logger.info("Migrations applied")


def seed_system_settings(db: Session) -> None:
    from app.models.system_setting import SystemSetting

    if db.query(SystemSetting).filter(SystemSetting.id == 1).first():
        return
    db.add(SystemSetting(id=1, resubmit_interval_months=settings.RESUBMIT_INTERVAL_MONTHS_DEFAULT))
    db.commit()
    logger.info("Seeded system settings")


def create_tables() -> None:
    """Create all tables if they don't exist.

    Adding a new model: define it, add it to app/models/__init__.py — done.
    No changes needed here.
    """
    _ensure_pgvector()
    Base.metadata.create_all(bind=engine)
    _run_migrations()
    logger.info("Database tables created/verified")


# Add new seed users here. Each dict maps directly to User model fields.
# Credentials for admin/demo are read from environment via settings.
_ADMIN_USER = {
    "email": settings.ADMIN_EMAIL,
    "password": settings.ADMIN_PASSWORD,
    "full_name": "System Administrator",
    "roles": ["admin", "user"],
    "is_active": True,
    "is_verified": True,
}

_DEMO_USERS = [
    {
        "email": settings.DEMO_EMAIL,
        "password": settings.DEMO_PASSWORD,
        "full_name": "Demo User",
        "phone": "+1234567890",
        "roles": ["user"],
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "doctor@health.local",
        "password": "doctor123",
        "full_name": "Dr. Demo Doctor",
        "roles": ["doctor"],
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "national@health.local",
        "password": "national123",
        "full_name": "National Admin",
        "roles": ["national_admin"],
        "is_active": True,
        "is_verified": True,
    },
]


def seed_default_users(db: Session) -> None:
    """Seed the configured admin and, in demo mode, local demo accounts."""
    seed_users = [_ADMIN_USER]
    if settings.SEED_DEMO_USERS:
        seed_users.extend(_DEMO_USERS)

    for spec in seed_users:
        email = spec["email"]
        if db.query(User).filter(User.email == email).first():
            continue
        user = User(
            email=email,
            password_hash=hash_password(spec["password"]),
            full_name=spec["full_name"],
            phone=spec.get("phone"),
            roles=spec["roles"],
            is_active=spec.get("is_active", True),
            is_verified=spec.get("is_verified", False),
        )
        db.add(user)
        logger.info("Seeded user: %s", email)

    db.commit()


def seed_national_demo_records(db: Session) -> None:
    """Seed district-scored records so national charts clear min cell size."""
    from datetime import datetime, timedelta, timezone

    from app.models.record import PatientRecord

    if db.query(PatientRecord).filter(PatientRecord.pid.like("NAT-SEED-%")).first():
        return

    seed_email = "national-seed@health.local"
    owner = db.query(User).filter(User.email == seed_email).first()
    if not owner:
        owner = User(
            email=seed_email,
            password_hash=hash_password("seeddata123"),
            full_name="National Seed Cohort",
            roles=["user"],
            is_active=True,
            is_verified=True,
        )
        db.add(owner)
        db.flush()

    districts = [
        ("Dhaka", 0.32),
        ("Gazipur", 0.24),
        ("Narayanganj", 0.28),
        ("Chittagong", 0.22),
        ("Sylhet", 0.15),
        ("Khulna", 0.18),
        ("Rajshahi", 0.16),
        ("Rangpur", 0.14),
        ("Barisal", 0.13),
        ("Mymensingh", 0.15),
        ("Jessore", 0.17),
        ("Dinajpur", 0.12),
    ]
    ages = [24, 28, 36, 42, 48, 55, 62, 68]
    genders = ["Male", "Female"]
    now = datetime.now(timezone.utc)
    n = 0

    for district, high_rate in districts:
        high_count = max(1, int(round(8 * high_rate)))
        for i in range(8):
            n += 1
            age = ages[i % len(ages)]
            gender = genders[i % 2]
            if i < high_count:
                risk = "high"
            elif i < high_count + 3:
                risk = "moderate"
            else:
                risk = "low"
            glucose = {"low": 95.0, "moderate": 118.0, "high": 145.0}[risk]
            bmi = {"low": 23.0, "moderate": 27.0, "high": 31.5}[risk]
            record = PatientRecord(
                user_id=owner.id,
                pid=f"NAT-SEED-{n:04d}",
                age=age,
                gender=gender,
                district=district,
                family_diabetes=risk != "low",
                family_hypertension=False,
                family_cvd=False,
                family_stroke=False,
                diabetes_history=risk == "high",
                hypertension=risk == "high",
                cvd=False,
                stroke=False,
                bp_systolic=120 + (10 if risk != "low" else 0),
                bp_diastolic=80,
                height=165.0,
                weight=round(bmi * (1.65**2), 1),
                bmi=bmi,
                pulse_rate=72,
                blood_glucose=glucose,
                smoking="Never",
                physical_activity=(
                    "Sedentary (little to no exercise)"
                    if risk != "low"
                    else "Moderate (3-5 days/week)"
                ),
                alcohol="Never",
                sleep_hours=7.0,
                sound_sleep=True,
                risk_level=risk,
                risk_explanation=f"Seeded {risk} risk profile for {district} national demo.",
                recommendations=["Seed demo tip"],
                risk_scored_at=now - timedelta(days=(n % 90)),
            )
            db.add(record)
            db.flush()
            record.created_at = now - timedelta(days=30 * (i % 6) + (n % 7))

    db.commit()
    logger.info("Seeded %s national demo records across %s districts", n, len(districts))
