from fastapi import APIRouter, Response

from app.api.deps import DB, PatientUser
from app.schemas.prescription import PrescriptionListItem, PrescriptionResponse
from app.services import prescription as prescription_service

router = APIRouter()


@router.get("", response_model=list[PrescriptionListItem])
def list_my_prescriptions(patient: PatientUser, db: DB):
    return prescription_service.list_patient_prescriptions(db, patient.id)


@router.get("/{prescription_id}", response_model=PrescriptionResponse)
def get_my_prescription(prescription_id: str, patient: PatientUser, db: DB):
    return prescription_service.get_prescription_for_patient(db, patient.id, prescription_id)


@router.get("/{prescription_id}/pdf")
def download_prescription_pdf(prescription_id: str, patient: PatientUser, db: DB):
    data = prescription_service.get_prescription_for_patient(db, patient.id, prescription_id)
    pdf_bytes = prescription_service.generate_prescription_pdf(data)
    filename = f"prescription-{prescription_id[:8]}.pdf"
    # Plain Response (not streaming) so Content-Length is set and the browser shows progress.
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
            "Cache-Control": "private, no-store",
        },
    )
