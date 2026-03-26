"""Consent management endpoints."""

from fastapi import APIRouter, Query

from app.api.deps import AdminUser, CurrentUser, DB, PatientUser
from app.schemas.consent import ConsentRequestCreate, ConsentRequestResponse, ConsentReviewAction
from app.services import consent as consent_svc

router = APIRouter()


@router.post("", response_model=ConsentRequestResponse, status_code=201)
def request_consent(
    body: ConsentRequestCreate,
    current_user: CurrentUser,
    db: DB,
):
    """Request access to a patient's health records."""
    return consent_svc.request_consent(
        db,
        patient_id=body.patient_id,
        requester_id=current_user.id,
        requester_role=current_user.roles[0] if current_user.roles else "user",
        purpose=body.purpose,
        expires_at=body.expires_at,
    )


@router.get("/my-requests", response_model=list[ConsentRequestResponse])
def my_sent_requests(
    current_user: CurrentUser,
    db: DB,
    status: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """Requests submitted by the current user."""
    return consent_svc.list_consent_requests(
        db, requester_id=current_user.id, status_filter=status, skip=skip, limit=limit
    )


@router.get("/my-consents", response_model=list[ConsentRequestResponse])
def my_received_consents(
    current_user: PatientUser,
    db: DB,
    status: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """Consent requests targeting the current patient (linked via patient.user_id)."""
    from app.models.patient import Patient

    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        return []
    return consent_svc.list_consent_requests(
        db, patient_id=patient.id, status_filter=status, skip=skip, limit=limit
    )


@router.post("/{consent_id}/approve", response_model=ConsentRequestResponse)
def approve_consent(
    consent_id: str,
    body: ConsentReviewAction,
    current_user: CurrentUser,
    db: DB,
):
    """Approve a consent request (patient or admin/co_pi)."""
    is_patient = "patient" in current_user.roles
    return consent_svc.approve_consent(
        db,
        consent_id=consent_id,
        reviewer_id=current_user.id,
        notes=body.notes,
        patient_user_id=current_user.id if is_patient else None,
    )


@router.post("/{consent_id}/reject", response_model=ConsentRequestResponse)
def reject_consent(
    consent_id: str,
    body: ConsentReviewAction,
    current_user: CurrentUser,
    db: DB,
):
    """Reject a consent request (patient or admin/co_pi)."""
    is_patient = "patient" in current_user.roles
    return consent_svc.reject_consent(
        db,
        consent_id=consent_id,
        reviewer_id=current_user.id,
        notes=body.notes,
        patient_user_id=current_user.id if is_patient else None,
    )


@router.get("", response_model=list[ConsentRequestResponse])
def list_all_consents(
    current_user: AdminUser,
    db: DB,
    patient_id: str | None = Query(None),
    status: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    """Admin: list all consent requests."""
    return consent_svc.list_consent_requests(
        db, patient_id=patient_id, status_filter=status, skip=skip, limit=limit
    )
