import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, SmallInteger, String, Text, event
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, _now


class Prescription(Base):
    __tablename__ = "prescriptions"
    __table_args__ = (
        CheckConstraint(
            "status IN ('draft', 'published', 'revoked')",
            name="ck_prescriptions_status",
        ),
        Index("ix_prescriptions_doctor_patient", "doctor_id", "patient_id"),
        Index("ix_prescriptions_patient_created", "patient_id", "created_at"),
    )

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    doctor_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    patient_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    grant_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("patient_doctor_grants.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)


@event.listens_for(Prescription, "before_insert")
def _share_insert_timestamp(mapper, connection, target: Prescription) -> None:
    """Column defaults call _now() separately, so align both stamps before insert."""
    now = _now()
    target.created_at = now
    target.updated_at = now


class PrescriptionItem(Base):
    __tablename__ = "prescription_items"
    __table_args__ = (
        CheckConstraint(
            "section IN ('symptoms_diagnosis', 'lab_tests', 'general_advice')",
            name="ck_prescription_items_section",
        ),
        Index("ix_prescription_items_prescription", "prescription_id", "section"),
    )

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    prescription_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False
    )
    section: Mapped[str] = mapped_column(String(30), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class PrescriptionMedication(Base):
    __tablename__ = "prescription_medications"
    __table_args__ = (
        Index("ix_prescription_medications_prescription", "prescription_id"),
    )

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    prescription_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False
    )
    medicine_name: Mapped[str] = mapped_column(String(200), nullable=False)
    dosage_morning: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    dosage_afternoon: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    dosage_night: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
