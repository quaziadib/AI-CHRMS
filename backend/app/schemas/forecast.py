from datetime import datetime
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field

from app.schemas.base import OrmSchema


class ForecastPoint(BaseModel):
    date: str
    glucose_mg_dl: float
    kind: Literal["actual", "forecast"]


class ForecastResult(BaseModel):
    model: str
    summary: str
    points: list[ForecastPoint]


class ForecastJobResponse(OrmSchema):
    id: str
    record_id: str
    user_id: str
    status: Literal["pending", "running", "completed", "failed"]
    result: Optional[ForecastResult] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
