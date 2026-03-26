"""Data Collector endpoints.

Allowed roles: data_collector, co_pi, admin
"""

from fastapi import APIRouter, Query

from app.api.deps import CollectorUser, DB
from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.schemas.record import PatientRecordCreate, PatientRecordResponse
from app.services import patient as patient_svc
from app.services import record as record_svc

router = APIRouter()


# ── Patients ──────────────────────────────────────────────────────────────────

@router.post("/patients", response_model=PatientResponse, status_code=201)
def register_patient(
    body: PatientCreate,
    current_user: CollectorUser,
    db: DB,
):
    """Register a new patient. Optionally provision a system login."""
    return patient_svc.create_patient(db, body, collector_id=current_user.id)


@router.get("/patients", response_model=list[PatientResponse])
def list_my_patients(
    current_user: CollectorUser,
    db: DB,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """List patients registered by this collector (admin/co_pi see all)."""
    collector_id = None if any(r in current_user.roles for r in ("admin", "co_pi")) else current_user.id
    return patient_svc.list_patients(db, collector_id=collector_id, skip=skip, limit=limit)


@router.patch("/patients/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    body: PatientUpdate,
    current_user: CollectorUser,
    db: DB,
):
    return patient_svc.update_patient(db, patient_id, body, actor_id=current_user.id)


# ── Health Records ────────────────────────────────────────────────────────────

@router.post("/patients/{patient_id}/records", response_model=PatientRecordResponse, status_code=201)
def create_record_for_patient(
    patient_id: str,
    body: PatientRecordCreate,
    current_user: CollectorUser,
    db: DB,
):
    """Create a health record on behalf of a patient.

    The record is linked to the patient's user_id if they have a system account,
    otherwise it is linked to a synthetic internal reference.
    """
    from app.models.patient import Patient
    from fastapi import HTTPException, status

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")
    if not patient.user_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Patient does not have a system account. Create an account first (create_account=true).",
        )
    return record_svc.create_record(db, body, user_id=patient.user_id)
