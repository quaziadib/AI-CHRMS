from fastapi import APIRouter, Response, status

from app.api.deps import DB, PatientUser
from app.schemas.patient_sharing import (
    DoctorOption,
    GrantCreate,
    InteractionResponse,
    MedicationCreate,
    MedicationResponse,
    PatientGrantResponse,
)
from app.services import patient_sharing as sharing_service

router = APIRouter()


@router.get("/doctors", response_model=list[DoctorOption])
def get_doctors(_patient: PatientUser, db: DB):
    return sharing_service.list_doctors(db)


@router.get("/grants", response_model=list[PatientGrantResponse])
def get_grants(patient: PatientUser, db: DB):
    return sharing_service.list_patient_grants(db, patient.id)


@router.post("/grants", response_model=PatientGrantResponse, status_code=status.HTTP_201_CREATED)
def create_grant(body: GrantCreate, patient: PatientUser, db: DB):
    return sharing_service.create_grant(db, patient.id, body.doctor_id)


@router.delete("/grants/{grant_id}", response_model=PatientGrantResponse)
def revoke_grant(grant_id: str, patient: PatientUser, db: DB):
    return sharing_service.revoke_grant(db, patient.id, grant_id)


@router.get("/medications", response_model=list[MedicationResponse])
def get_medications(patient: PatientUser, db: DB):
    return sharing_service.list_medications(db, patient.id)


@router.post("/medications", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
def create_medication(body: MedicationCreate, patient: PatientUser, db: DB):
    return sharing_service.create_medication(db, patient.id, body)


@router.patch("/medications/{medication_id}", response_model=MedicationResponse)
def update_medication(medication_id: str, body: MedicationCreate, patient: PatientUser, db: DB):
    return sharing_service.update_medication(db, patient.id, medication_id, body)


@router.delete("/medications/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_medication(medication_id: str, patient: PatientUser, db: DB):
    sharing_service.delete_medication(db, patient.id, medication_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/interactions", response_model=list[InteractionResponse])
def get_interactions(patient: PatientUser, db: DB):
    return sharing_service.list_patient_interactions(db, patient.id)
