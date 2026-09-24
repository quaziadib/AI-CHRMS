from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.base import OrmSchema
from app.schemas.record import PatientRecordResponse


class DoctorOption(BaseModel):
    id: str
    full_name: str
    email: str


class GrantCreate(BaseModel):
    doctor_id: str


class GrantDecision(BaseModel):
    decision: Literal["accept", "decline"]


class PatientGrantResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    doctor_name: str | None = None
    patient_name: str | None = None
    status: Literal["pending", "active", "declined", "revoked"]
    created_at: datetime
    responded_at: datetime | None = None
    revoked_at: datetime | None = None


class MedicationCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    dosage: str | None = Field(default=None, max_length=255)
    start_date: date | None = None
    end_date: date | None = None


class MedicationResponse(OrmSchema):
    id: str
    patient_id: str
    name: str
    dosage: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    created_at: datetime
    updated_at: datetime


class InteractionCreate(BaseModel):
    note: str = Field(min_length=1, max_length=10000)
    interaction_at: datetime | None = None


class InteractionResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    doctor_name: str | None = None
    interaction_at: datetime
    note: str
    created_at: datetime


class AccessEventResponse(BaseModel):
    id: str
    grant_id: str | None = None
    patient_id: str
    patient_name: str | None = None
    doctor_id: str
    doctor_name: str | None = None
    actor_id: str
    actor_name: str | None = None
    event_type: str
    occurred_at: datetime


class DoctorPatientProfileResponse(BaseModel):
    patient_id: str
    patient_name: str
    latest_record: PatientRecordResponse | None = None
    records: list[PatientRecordResponse]
    medications: list[MedicationResponse]
    interactions: list[InteractionResponse]


class DoctorPatientListItem(BaseModel):
    patient_id: str
    patient_name: str
    latest_record: PatientRecordResponse | None = None
