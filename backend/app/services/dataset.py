from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.dataset import DatasetSubmission
from app.schemas.dataset import DatasetSubmissionCreate
from app.services.audit import log_audit


def submit_dataset(db: Session, data: DatasetSubmissionCreate, user_id: str) -> DatasetSubmission:
    submission = DatasetSubmission(
        submitted_by=user_id,
        title=data.title,
        description=data.description,
        file_url=data.file_url,
        record_count=data.record_count,
        status="pending",
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    log_audit(db, user_id, "dataset_submitted", "dataset_submission", submission.id)
    return submission


def list_datasets(
    db: Session,
    submitted_by: str | None = None,
    status_filter: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[DatasetSubmission]:
    q = db.query(DatasetSubmission)
    if submitted_by:
        q = q.filter(DatasetSubmission.submitted_by == submitted_by)
    if status_filter:
        q = q.filter(DatasetSubmission.status == status_filter)
    return q.order_by(DatasetSubmission.created_at.desc()).offset(skip).limit(limit).all()


def get_dataset_or_404(db: Session, dataset_id: str) -> DatasetSubmission:
    ds = db.query(DatasetSubmission).filter(DatasetSubmission.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dataset not found")
    return ds


def _review_dataset(
    db: Session,
    dataset_id: str,
    reviewer_id: str,
    new_status: str,
    notes: str | None,
) -> DatasetSubmission:
    ds = get_dataset_or_404(db, dataset_id)
    if ds.status not in ("pending", "processing"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dataset is already {ds.status}",
        )
    ds.status = new_status
    ds.reviewed_at = datetime.now(timezone.utc)
    ds.reviewed_by = reviewer_id
    ds.admin_notes = notes
    db.commit()
    db.refresh(ds)
    log_audit(db, reviewer_id, f"dataset_{new_status}", "dataset_submission", dataset_id)
    return ds


def approve_dataset(db: Session, dataset_id: str, reviewer_id: str, notes: str | None) -> DatasetSubmission:
    return _review_dataset(db, dataset_id, reviewer_id, "approved", notes)


def reject_dataset(db: Session, dataset_id: str, reviewer_id: str, notes: str | None) -> DatasetSubmission:
    return _review_dataset(db, dataset_id, reviewer_id, "rejected", notes)
