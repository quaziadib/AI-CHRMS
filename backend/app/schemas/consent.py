from datetime import datetime

from app.schemas.base import OrmSchema


class ConsentRequestCreate(OrmSchema):
    patient_id: str
    purpose: str
    expires_at: datetime | None = None


class ConsentReviewAction(OrmSchema):
    notes: str | None = None


class ConsentRequestResponse(OrmSchema):
    id: str
    patient_id: str
    requester_id: str
    requester_role: str
    purpose: str
    status: str
    reviewed_at: datetime | None
    reviewed_by: str | None
    expires_at: datetime | None
    notes: str | None
    created_at: datetime
