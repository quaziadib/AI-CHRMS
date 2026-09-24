import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, _now


class PatientDoctorConversation(Base):
    __tablename__ = "patient_doctor_conversations"
    __table_args__ = (
        UniqueConstraint("patient_id", "doctor_id", name="uq_patient_doctor_conversation_pair"),
        Index("ix_patient_doctor_conversations_patient_updated", "patient_id", "updated_at"),
        Index("ix_patient_doctor_conversations_doctor_updated", "doctor_id", "updated_at"),
    )

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    patient_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    doctor_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    patient_last_read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    doctor_last_read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)


class PatientDoctorMessage(Base):
    __tablename__ = "patient_doctor_messages"
    __table_args__ = (
        Index("ix_patient_doctor_messages_conversation_created", "conversation_id", "created_at"),
    )

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    conversation_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("patient_doctor_conversations.id", ondelete="CASCADE"),
        nullable=False,
    )
    grant_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("patient_doctor_grants.id", ondelete="SET NULL"),
        nullable=True,
    )
    sender_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
