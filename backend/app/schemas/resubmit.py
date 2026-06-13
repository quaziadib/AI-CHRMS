from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class SystemSettingsResponse(BaseModel):
    resubmit_interval_months: int = Field(ge=1, le=36)
    updated_at: datetime
    updated_by: Optional[str] = None


class SystemSettingsUpdate(BaseModel):
    resubmit_interval_months: int = Field(ge=1, le=36)


class ResubmitStatusResponse(BaseModel):
    interval_months: int
    latest_submission_at: Optional[datetime] = None
    next_due_at: Optional[datetime] = None
    is_due: bool
    days_until_due: Optional[int] = None
    submission_count: int
    can_submit_new: bool
    status: Literal["initial", "current", "upcoming", "due"]


class HealthTrendPoint(BaseModel):
    record_id: str
    pid: str
    submitted_at: datetime
    blood_glucose: Optional[float] = None
    bmi: float
    bp_systolic: int
    bp_diastolic: int
    risk_level: Optional[str] = None
    risk_score: Optional[int] = None


class HealthTrendsResponse(BaseModel):
    submissions: list[HealthTrendPoint]
