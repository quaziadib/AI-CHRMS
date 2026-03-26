import hashlib
import secrets

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.patient import Patient
from app.models.user import User
from app.schemas.patient import PatientCreate, PatientUpdate
from app.services.audit import log_audit


def _hash_nid(nid: str) -> str:
    return hashlib.sha256(nid.strip().encode()).hexdigest()


def create_patient(db: Session, data: PatientCreate, collector_id: str) -> Patient:
    """Register a new patient. Optionally provision a system login."""
    nid_hash = _hash_nid(data.nid) if data.nid else None

    # Prevent duplicate NID registration
    if nid_hash and db.query(Patient).filter(Patient.nid_hash == nid_hash).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A patient with this NID is already registered",
        )

    user_id: str | None = None

    if data.create_account:
        if not data.account_email:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="account_email is required when create_account=true",
            )
        if db.query(User).filter(User.email == data.account_email).first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        temp_password = secrets.token_urlsafe(12)
        user = User(
            email=data.account_email,
            password_hash=hash_password(temp_password),
            full_name=data.full_name,
            phone=data.phone,
            roles=["patient"],
            is_active=True,
            is_verified=False,
        )
        db.add(user)
        db.flush()
        user_id = user.id
        # TODO: queue send_patient_credentials_email.delay(data.account_email, temp_password, data.full_name)

    patient = Patient(
        user_id=user_id,
        created_by=collector_id,
        full_name=data.full_name,
        phone=data.phone,
        date_of_birth=data.date_of_birth,
        district=data.district,
        address=data.address,
        nid_hash=nid_hash,
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    log_audit(db, collector_id, "patient_created", "patient", patient.id)
    return patient


def list_patients(
    db: Session,
    collector_id: str | None = None,
    skip: int = 0,
    limit: int = 50,
) -> list[Patient]:
    q = db.query(Patient)
    if collector_id:
        q = q.filter(Patient.created_by == collector_id)
    return q.order_by(Patient.created_at.desc()).offset(skip).limit(limit).all()


def get_patient_or_404(db: Session, patient_id: str) -> Patient:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    return patient


def update_patient(db: Session, patient_id: str, data: PatientUpdate, actor_id: str) -> Patient:
    patient = get_patient_or_404(db, patient_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    log_audit(db, actor_id, "patient_updated", "patient", patient_id)
    return patient
