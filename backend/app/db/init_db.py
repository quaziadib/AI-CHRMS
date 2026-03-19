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
    No changes needed here.
    """
    Base.metadata.create_all(bind=engine)
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
