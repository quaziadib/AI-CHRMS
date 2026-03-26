from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.consent import ConsentRequest
from app.models.patient import Patient
from app.services.audit import log_audit


def request_consent(
    db: Session,
    patient_id: str,
    requester_id: str,
    requester_role: str,
    purpose: str,
    expires_at: datetime | None = None,
) -> ConsentRequest:
    # Verify patient exists
    if not db.query(Patient).filter(Patient.id == patient_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    # Prevent duplicate pending requests from same requester
    existing = (
        db.query(ConsentRequest)
        .filter(
            ConsentRequest.patient_id == patient_id,
            ConsentRequest.requester_id == requester_id,
            ConsentRequest.status == "pending",
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pending consent request already exists for this patient",
        )

    req = ConsentRequest(
        patient_id=patient_id,
        requester_id=requester_id,
        requester_role=requester_role,
        purpose=purpose,
        status="pending",
        expires_at=expires_at,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    log_audit(db, requester_id, "consent_requested", "consent_request", req.id)
    return req


def _review_consent(
    db: Session,
    consent_id: str,
    reviewer_id: str,
    new_status: str,
    notes: str | None,
    patient_user_id: str | None = None,
) -> ConsentRequest:
    req = db.query(ConsentRequest).filter(ConsentRequest.id == consent_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consent request not found")
    if req.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Request is already {req.status}",
        )
    # If called from patient endpoint, verify ownership
    if patient_user_id:
        patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
        if not patient or patient.user_id != patient_user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your consent request")

    req.status = new_status
    req.reviewed_at = datetime.now(timezone.utc)
    req.reviewed_by = reviewer_id
    req.notes = notes
    db.commit()
    db.refresh(req)
    log_audit(db, reviewer_id, f"consent_{new_status}", "consent_request", consent_id)
    return req


def approve_consent(db: Session, consent_id: str, reviewer_id: str, notes: str | None, patient_user_id: str | None = None) -> ConsentRequest:
    return _review_consent(db, consent_id, reviewer_id, "approved", notes, patient_user_id)


def reject_consent(db: Session, consent_id: str, reviewer_id: str, notes: str | None, patient_user_id: str | None = None) -> ConsentRequest:
    return _review_consent(db, consent_id, reviewer_id, "rejected", notes, patient_user_id)


def list_consent_requests(
    db: Session,
    requester_id: str | None = None,
    patient_id: str | None = None,
    status_filter: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[ConsentRequest]:
    q = db.query(ConsentRequest)
    if requester_id:
        q = q.filter(ConsentRequest.requester_id == requester_id)
    if patient_id:
        q = q.filter(ConsentRequest.patient_id == patient_id)
    if status_filter:
        q = q.filter(ConsentRequest.status == status_filter)
    return q.order_by(ConsentRequest.created_at.desc()).offset(skip).limit(limit).all()
