from datetime import date

from pydantic import field_validator

from app.schemas.base import OrmSchema


class PatientCreate(OrmSchema):
    full_name: str
    phone: str | None = None
    date_of_birth: date | None = None
    district: str | None = None
    address: str | None = None
    # Raw NID supplied by collector — hashed before storage, never returned
    nid: str | None = None
    # Optionally provision a system login for the patient
    create_account: bool = False
    account_email: str | None = None

    @field_validator("full_name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("full_name must not be blank")
        return v.strip()


class PatientResponse(OrmSchema):
    id: str
    user_id: str | None
    created_by: str
    full_name: str
    phone: str | None
    date_of_birth: date | None
    district: str | None
    address: str | None
    # nid_hash intentionally excluded from responses


class PatientUpdate(OrmSchema):
    full_name: str | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    district: str | None = None
    address: str | None = None
