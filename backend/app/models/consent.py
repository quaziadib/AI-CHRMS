import uuid

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class ConsentRequest(TimestampMixin, Base):
    """Tracks requests for access to a patient's health records.

    Flow:
      requester (any role) → POST /consent/request  → status=pending
      patient              → POST /consent/{id}/approve|reject
      admin/co_pi          → can also approve in override scenarios
    """

    __tablename__ = "consent_requests"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    # FK to patients.id — whose data is being requested
    patient_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    # User requesting access
    requester_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    requester_role: Mapped[str] = mapped_column(String(50), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False)

    # pending | approved | rejected | revoked
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)

    reviewed_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    expires_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
