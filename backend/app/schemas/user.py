from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, computed_field, field_validator

from app.schemas.base import OrmSchema

SignupRole = Literal["user", "doctor", "national_admin", "admin"]
ELEVATED_SIGNUP_ROLES = frozenset({"doctor", "national_admin", "admin"})


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, description="Minimum 8 characters")
    full_name: str = Field(min_length=2, max_length=255)
    phone: Optional[str] = None
    role: SignupRole = "user"

    @field_validator("email", mode="before")
    @classmethod
    def normalise_email(cls, v: str) -> str:
        return v.strip().lower()


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
