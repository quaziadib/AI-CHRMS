from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, computed_field, field_validator, model_validator

from app.schemas.base import OrmSchema

SignupRole = Literal["user", "doctor", "national_admin", "admin"]
ELEVATED_SIGNUP_ROLES = frozenset({"doctor", "national_admin", "admin"})


ID_PIC_MAX_LENGTH = 2_000_000


class DoctorProfileCreate(BaseModel):
    specialization: str = Field(min_length=2, max_length=255)
    affiliations: list[str] = Field(default_factory=list, max_length=20)
    division: str = Field(min_length=2, max_length=100)
    district: str = Field(min_length=2, max_length=100)
    location: str = Field(min_length=2, max_length=1000)
    id_pic: Optional[str] = Field(default=None, max_length=ID_PIC_MAX_LENGTH)

    @field_validator("specialization", "division", "district", "location", mode="before")
    @classmethod
    def strip_text(cls, v):
        return v.strip() if isinstance(v, str) else v

    @field_validator("affiliations")
    @classmethod
    def clean_affiliations(cls, v: list[str]) -> list[str]:
        cleaned = [a.strip() for a in v if a and a.strip()]
        if any(len(a) > 255 for a in cleaned):
            raise ValueError("Each affiliation must be at most 255 characters")
        return cleaned


class DoctorProfileResponse(OrmSchema):
    """Owner/admin view, includes the ID picture reference."""

    specialization: str
    affiliations: list[str]
    division: str
    district: str
    location: str
    id_pic: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Minimum 8 characters")
    full_name: str = Field(min_length=2, max_length=255)
    phone: Optional[str] = None
    role: SignupRole = "user"
    doctor_profile: Optional[DoctorProfileCreate] = None

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()

    @model_validator(mode="after")
    def check_doctor_profile(self) -> "UserCreate":
        if self.role == "doctor" and self.doctor_profile is None:
            raise ValueError("doctor_profile is required when registering as a doctor")
        if self.role != "doctor" and self.doctor_profile is not None:
            raise ValueError("doctor_profile is only allowed when registering as a doctor")
        return self


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(OrmSchema):
    id: str
    email: str
    full_name: str
    phone: Optional[str]
    is_active: bool
    is_verified: bool
    roles: list[str]
    requested_role: Optional[str] = None
    role_request_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    @computed_field  # type: ignore[misc]
    @property
    def role(self) -> str:
        for r in ("admin", "doctor", "national_admin"):
            if r in self.roles:
                return r
        return "user"


class RoleRequestResponse(UserResponse):
    doctor_profile: Optional[DoctorProfileResponse] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = None


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=255)
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    roles: Optional[list[str]] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, description="Minimum 8 characters")


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


def roles_for_approved_signup(requested: str) -> list[str]:
    if requested == "admin":
        return ["admin", "user"]
    if requested in ELEVATED_SIGNUP_ROLES:
        return [requested]
    return ["user"]
