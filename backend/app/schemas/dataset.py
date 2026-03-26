from datetime import datetime

from app.schemas.base import OrmSchema


class DatasetSubmissionCreate(OrmSchema):
    title: str
    description: str
    file_url: str | None = None
    record_count: int | None = None


class DatasetReviewAction(OrmSchema):
    admin_notes: str | None = None


class DatasetSubmissionResponse(OrmSchema):
    id: str
    submitted_by: str
    title: str
    description: str
    status: str
    file_url: str | None
    record_count: int | None
    reviewed_at: datetime | None
    reviewed_by: str | None
    admin_notes: str | None
    created_at: datetime
    updated_at: datetime
