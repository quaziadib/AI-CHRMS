"""Dataset submission and management endpoints."""

from fastapi import APIRouter, Query

from app.api.deps import AdminUser, CurrentUser, DB
from app.schemas.dataset import DatasetReviewAction, DatasetSubmissionCreate, DatasetSubmissionResponse
from app.services import dataset as dataset_svc

router = APIRouter()


@router.post("", response_model=DatasetSubmissionResponse, status_code=201)
def submit_dataset(
    body: DatasetSubmissionCreate,
    current_user: CurrentUser,
    db: DB,
):
    """Submit a dataset for review."""
    return dataset_svc.submit_dataset(db, body, user_id=current_user.id)


@router.get("", response_model=list[DatasetSubmissionResponse])
def list_datasets(
    current_user: CurrentUser,
    db: DB,
    status: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """List datasets. Regular users see only their own; admin sees all."""
    owner = None if "admin" in current_user.roles else current_user.id
    return dataset_svc.list_datasets(db, submitted_by=owner, status_filter=status, skip=skip, limit=limit)


@router.get("/{dataset_id}", response_model=DatasetSubmissionResponse)
def get_dataset(
    dataset_id: str,
    current_user: CurrentUser,
    db: DB,
):
    """Get a specific dataset. Non-admin users can only view their own."""
    from fastapi import HTTPException, status

    ds = dataset_svc.get_dataset_or_404(db, dataset_id)
    if "admin" not in current_user.roles and ds.submitted_by != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return ds


@router.post("/{dataset_id}/approve", response_model=DatasetSubmissionResponse)
def approve_dataset(
    dataset_id: str,
    body: DatasetReviewAction,
    current_user: AdminUser,
    db: DB,
):
    return dataset_svc.approve_dataset(db, dataset_id, reviewer_id=current_user.id, notes=body.admin_notes)


@router.post("/{dataset_id}/reject", response_model=DatasetSubmissionResponse)
def reject_dataset(
    dataset_id: str,
    body: DatasetReviewAction,
    current_user: AdminUser,
    db: DB,
):
    return dataset_svc.reject_dataset(db, dataset_id, reviewer_id=current_user.id, notes=body.admin_notes)
