import uuid

from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class PatientRecord(TimestampMixin, Base):
    __tablename__ = "patient_records"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    pid: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)

    # Demographics
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)

    # Family History
    family_diabetes: Mapped[bool] = mapped_column(Boolean, default=False)
    family_hypertension: Mapped[bool] = mapped_column(Boolean, default=False)
    family_cvd: Mapped[bool] = mapped_column(Boolean, default=False)
    family_stroke: Mapped[bool] = mapped_column(Boolean, default=False)

    # Medical History
    diabetes_history: Mapped[bool] = mapped_column(Boolean, default=False)
    hypertension: Mapped[bool] = mapped_column(Boolean, default=False)
    cvd: Mapped[bool] = mapped_column(Boolean, default=False)
    stroke: Mapped[bool] = mapped_column(Boolean, default=False)
    allergies: Mapped[str | None] = mapped_column(Text, nullable=True)
    pregnancies: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Vital Signs
    bp_systolic: Mapped[int] = mapped_column(Integer, nullable=False)
    bp_diastolic: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[float] = mapped_column(Float, nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    bmi: Mapped[float] = mapped_column(Float, nullable=False)
    pulse_rate: Mapped[int] = mapped_column(Integer, nullable=False)

    # Lab Tests
    blood_glucose: Mapped[float | None] = mapped_column(Float, nullable=True)
    cholesterol: Mapped[float | None] = mapped_column(Float, nullable=True)
    hemoglobin: Mapped[float | None] = mapped_column(Float, nullable=True)
    creatinine: Mapped[float | None] = mapped_column(Float, nullable=True)
    ecg_result: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Clinical
    symptoms: Mapped[str | None] = mapped_column(Text, nullable=True)
    diagnosis: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Lifestyle
    smoking: Mapped[str] = mapped_column(String(50), nullable=False)
    physical_activity: Mapped[str] = mapped_column(String(100), nullable=False)
    alcohol: Mapped[str] = mapped_column(String(50), nullable=False)
    sleep_hours: Mapped[float] = mapped_column(Float, nullable=False)
    sound_sleep: Mapped[bool] = mapped_column(Boolean, default=False)
