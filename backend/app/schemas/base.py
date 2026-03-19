from datetime import datetime

from pydantic import BaseModel, field_serializer


class OrmSchema(BaseModel):
    """Base for all ORM-backed response schemas.

    Provides:
    - from_attributes = True  (so model_validate works on SQLAlchemy objects)
    - automatic datetime → ISO 8601 string serialization for any datetime field
    """

    model_config = {"from_attributes": True}

    @field_serializer("created_at", "updated_at", "timestamp", check_fields=False)
    def serialize_dt(self, dt: datetime) -> str:
        return dt.isoformat()
