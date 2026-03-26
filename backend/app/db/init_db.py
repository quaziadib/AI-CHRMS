import logging

from sqlalchemy.orm import Session

import app.models  # noqa: F401 — registers all models with Base so create_all sees them
from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base, engine
from app.models.user import User

logger = logging.getLogger(__name__)


def create_tables() -> None:
    """Create all tables if they don't exist.

    Adding a new model: define it, add it to app/models/__init__.py — done.
    """
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified")


# Seed one account per system role for development/testing.
# Credentials come from environment — never hard-code secrets here.
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
        "email": settings.COPI_EMAIL,
        "password": settings.COPI_PASSWORD,
        "full_name": "Co-Principal Investigator",
        "roles": ["co_pi"],
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": settings.COLLECTOR_EMAIL,
        "password": settings.COLLECTOR_PASSWORD,
        "full_name": "Demo Data Collector",
        "roles": ["data_collector"],
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": settings.ML_EMAIL,
        "password": settings.ML_PASSWORD,
        "full_name": "Demo ML Engineer",
        "roles": ["ml_engineer"],
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": settings.DEMO_EMAIL,
        "password": settings.DEMO_PASSWORD,
        "full_name": "Demo General User",
        "phone": "+8801700000000",
        "roles": ["user"],
        "is_active": True,
        "is_verified": True,
    },
]


def seed_default_users(db: Session) -> None:
    """Seed default users if they don't exist (idempotent)."""
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
        logger.info("Seeded user: %s (%s)", email, spec["roles"])

    db.commit()
