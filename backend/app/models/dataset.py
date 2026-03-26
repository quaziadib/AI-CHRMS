import uuid

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class DatasetSubmission(TimestampMixin, Base):
    """A dataset contributed by a general user or researcher.

    Status flow:
      pending → approved | rejected
      approved → processing → published
    """

    __tablename__ = "dataset_submissions"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    submitted_by: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    # pending | approved | rejected | processing | published
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)

    file_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    record_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    reviewed_at: Mapped[str | None] = mapped_column(DateTime(timezone=True), nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(String(36), nullable=True)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
