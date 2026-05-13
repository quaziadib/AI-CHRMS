import logging

from sqlalchemy import text
from sqlalchemy.orm import Session

import app.models  # noqa: F401 — registers all models with Base so create_all sees them
from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base, engine
from app.models.user import User

logger = logging.getLogger(__name__)


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
        conn.commit()
    logger.info("Migrations applied")


def create_tables() -> None:
    """Create all tables if they don't exist.

    Adding a new model: define it, add it to app/models/__init__.py — done.
    No changes needed here.
    """
    Base.metadata.create_all(bind=engine)
    _run_migrations()
    logger.info("Database tables created/verified")


# Add new seed users here. Each dict maps directly to User model fields.
# Credentials for admin/demo are read from environment via settings.
_SEED_USERS = [
    {
        "email": settings.ADMIN_EMAIL,
        "password": settings.ADMIN_PASSWORD,
        "full_name": "System Administrator",
        "roles": ["admin", "user"],
        "is_active": True,
        "is_verified": True,
    },
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
    """Seed default users if they don't exist."""
    for spec in _SEED_USERS:
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
