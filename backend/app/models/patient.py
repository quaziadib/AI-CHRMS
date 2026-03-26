import uuid

from sqlalchemy import Date, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Patient(TimestampMixin, Base):
    """A data subject registered by a Data Collector.

    Distinct from User — a Patient may or may not have a system login.
    When a system account is created for the patient, user_id is populated.
    NID is stored as a SHA-256 hash; the raw value is never persisted.
    """

    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # FK to users table — set when the patient is given system access
    user_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    # Data Collector who registered this patient
    created_by: Mapped[str] = mapped_column(String(36), nullable=False, index=True)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    date_of_birth: Mapped[str | None] = mapped_column(Date, nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)

    # SHA-256 of the national ID — raw value never stored
    nid_hash: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
