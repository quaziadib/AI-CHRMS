from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.schemas.base import OrmSchema


class PatientRecordBase(BaseModel):
    """All patient fields optional — used as base for Create (overrides required) and Update."""
    # Demographics
    age: Optional[int] = Field(None, ge=0, le=150)
    gender: Optional[str] = None
    district: Optional[str] = None
    # Family History
    family_diabetes: Optional[bool] = None
    family_hypertension: Optional[bool] = None
    family_cvd: Optional[bool] = None
    family_stroke: Optional[bool] = None
    # Medical History
    diabetes_history: Optional[bool] = None
    hypertension: Optional[bool] = None
    cvd: Optional[bool] = None
    stroke: Optional[bool] = None
    allergies: Optional[str] = None
    pregnancies: Optional[int] = None
    # Vital Signs
    bp_systolic: Optional[int] = Field(None, ge=50, le=300)
    bp_diastolic: Optional[int] = Field(None, ge=30, le=200)
    height: Optional[float] = Field(None, ge=30, le=300)
    weight: Optional[float] = Field(None, ge=1, le=500)
    bmi: Optional[float] = None
    pulse_rate: Optional[int] = Field(None, ge=20, le=250)
    # Lab Tests
    blood_glucose: Optional[float] = None
    cholesterol: Optional[float] = None
    hemoglobin: Optional[float] = None
    creatinine: Optional[float] = None
    ecg_result: Optional[str] = None
    # Clinical
    symptoms: Optional[str] = None
    diagnosis: Optional[str] = None
    # Lifestyle
    smoking: Optional[str] = None
    physical_activity: Optional[str] = None
    alcohol: Optional[str] = None
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    sound_sleep: Optional[bool] = None


class PatientRecordCreate(PatientRecordBase):
    """Overrides required fields for record creation."""
    age: int = Field(ge=0, le=150)
    gender: str
    district: str
    bp_systolic: int = Field(ge=50, le=300)
    bp_diastolic: int = Field(ge=30, le=200)
    height: float = Field(ge=30, le=300)
    weight: float = Field(ge=1, le=500)
    bmi: float
    pulse_rate: int = Field(ge=20, le=250)
    smoking: str
    physical_activity: str
    alcohol: str
    sleep_hours: float = Field(ge=0, le=24)
    family_diabetes: bool = False
    family_hypertension: bool = False
    family_cvd: bool = False
    family_stroke: bool = False
    diabetes_history: bool = False
    hypertension: bool = False
    cvd: bool = False
    stroke: bool = False
    sound_sleep: bool = False


class PatientRecordUpdate(PatientRecordBase):
    pass


class PatientRecordResponse(OrmSchema):
    id: str
    user_id: str
    pid: str
    age: int
    gender: str
    district: str
    family_diabetes: bool
    family_hypertension: bool
    family_cvd: bool
    family_stroke: bool
    diabetes_history: bool
    hypertension: bool
    cvd: bool
    stroke: bool
    allergies: Optional[str]
    pregnancies: Optional[int]
    bp_systolic: int
    bp_diastolic: int
    height: float
    weight: float
    bmi: float
    pulse_rate: int
    blood_glucose: Optional[float]
    cholesterol: Optional[float]
    hemoglobin: Optional[float]
    creatinine: Optional[float]
    ecg_result: Optional[str]
    symptoms: Optional[str]
    diagnosis: Optional[str]
    smoking: str
    physical_activity: str
    alcohol: str
    sleep_hours: float
    sound_sleep: bool
    created_at: datetime
    updated_at: datetime
