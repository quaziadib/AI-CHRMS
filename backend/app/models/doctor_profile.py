from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class DoctorProfile(TimestampMixin, Base):
    """Doctor-only fields. Identity, credentials and active/verified flags live on User."""

    __tablename__ = "doctor_profiles"

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    specialization: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    affiliations: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    division: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    location: Mapped[str] = mapped_column(Text, nullable=False)
    id_pic: Mapped[str | None] = mapped_column(Text, nullable=True)

    user = relationship("User", back_populates="doctor_profile")

    __table_args__ = (Index("ix_doctor_profiles_division_district", "division", "district"),)
