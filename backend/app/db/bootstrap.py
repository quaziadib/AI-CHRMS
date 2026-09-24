import logging

from app.core.config import settings
from app.db.init_db import (
    create_tables,
    seed_default_users,
    seed_national_demo_records,
    seed_system_settings,
)
from app.db.seed_synthetic import seed_synthetic_data
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


def bootstrap_database() -> None:
    """Create or migrate the schema and seed the configured initial accounts."""
    create_tables()
    db = SessionLocal()
    try:
        seed_default_users(db)
        seed_system_settings(db)
        if settings.SEED_DEMO_USERS:
            seed_national_demo_records(db)
        if settings.SEED_SYNTHETIC_DATA:
            seed_synthetic_data(db)
    finally:
        db.close()
    logger.info("Database bootstrap complete")


if __name__ == "__main__":
    bootstrap_database()
