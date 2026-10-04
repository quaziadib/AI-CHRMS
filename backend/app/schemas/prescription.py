from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.base import OrmSchema

PrescriptionStatus = Literal["draft", "published", "revoked"]
PrescriptionSection = Literal["symptoms_diagnosis", "lab_tests", "general_advice"]


class PrescriptionItemIn(BaseModel):
    content: str = Field(min_length=1, max_length=500)
    order: int = Field(default=0, ge=0)


class PrescriptionMedicationIn(BaseModel):
    medicine_name: str = Field(min_length=1, max_length=200)
    dosage_morning: int = Field(default=0, ge=0)
    dosage_afternoon: int = Field(default=0, ge=0)
    dosage_night: int = Field(default=0, ge=0)
    duration_days: int = Field(ge=1)
    instructions: str | None = Field(default=None, max_length=500)
    order: int = Field(default=0, ge=0)


class PrescriptionCreate(BaseModel):
    status: Literal["draft", "published"] = "draft"
    symptoms_diagnosis: list[PrescriptionItemIn] = Field(default_factory=list)
    lab_tests: list[PrescriptionItemIn] = Field(default_factory=list)
    general_advice: list[PrescriptionItemIn] = Field(default_factory=list)
    medications: list[PrescriptionMedicationIn] = Field(default_factory=list)


class PrescriptionUpdate(BaseModel):
    status: Literal["draft", "published", "revoked"] | None = None
    symptoms_diagnosis: list[PrescriptionItemIn] | None = None
    lab_tests: list[PrescriptionItemIn] | None = None
    general_advice: list[PrescriptionItemIn] | None = None
    medications: list[PrescriptionMedicationIn] | None = None

    @model_validator(mode="after")
    def at_least_one_field(self) -> "PrescriptionUpdate":
        if all(v is None for v in [self.status, self.symptoms_diagnosis, self.lab_tests, self.general_advice, self.medications]):
            raise ValueError("At least one field must be provided for update")
        return self


class PrescriptionItemResponse(OrmSchema):
    id: str
    section: str
    content: str
    order: int


class PrescriptionMedicationResponse(OrmSchema):
    id: str
    medicine_name: str
    dosage_morning: int
    dosage_afternoon: int
    dosage_night: int
    duration_days: int
    instructions: str | None = None
    order: int


class PrescriptionResponse(OrmSchema):
    id: str
    doctor_id: str
    patient_id: str
    grant_id: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
    doctor_name: str | None = None
    patient_name: str | None = None
    symptoms_diagnosis: list[PrescriptionItemResponse] = Field(default_factory=list)
    lab_tests: list[PrescriptionItemResponse] = Field(default_factory=list)
    general_advice: list[PrescriptionItemResponse] = Field(default_factory=list)
    medications: list[PrescriptionMedicationResponse] = Field(default_factory=list)


class PrescriptionListItem(OrmSchema):
    id: str
    doctor_id: str
    patient_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    doctor_name: str | None = None
    patient_name: str | None = None
