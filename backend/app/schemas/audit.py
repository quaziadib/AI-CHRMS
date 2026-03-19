from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.schemas.base import OrmSchema


class AuditLogResponse(OrmSchema):
    id: str
    user_id: str
    user_email: Optional[str]
    action: str
    entity_type: str
    entity_id: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    status: str
    timestamp: datetime


class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    total_records: int
    records_today: int
    records_this_week: int
    records_this_month: int
