import io
import logging
import os
from datetime import datetime, timezone

from fastapi import HTTPException, status
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session

from app.models.prescription import Prescription, PrescriptionItem, PrescriptionMedication
from app.models.user import User
from app.schemas.prescription import (
    PrescriptionCreate,
    PrescriptionListItem,
    PrescriptionMedicationResponse,
    PrescriptionItemResponse,
    PrescriptionResponse,
    PrescriptionUpdate,
)
from app.services.audit import log_audit
from app.services.patient_sharing import require_active_grant

logger = logging.getLogger(__name__)


def _item_section(items: list[PrescriptionItem], section: str) -> list[PrescriptionItemResponse]:
    return [
        PrescriptionItemResponse(id=i.id, section=i.section, content=i.content, order=i.order)
        for i in sorted(items, key=lambda x: x.order)
        if i.section == section
    ]


def _build_response(db: Session, p: Prescription) -> PrescriptionResponse:
    items = db.query(PrescriptionItem).filter(PrescriptionItem.prescription_id == p.id).all()
    meds = db.query(PrescriptionMedication).filter(
        PrescriptionMedication.prescription_id == p.id
    ).order_by(PrescriptionMedication.order).all()
    doctor = db.query(User).filter(User.id == p.doctor_id).first()
    patient = db.query(User).filter(User.id == p.patient_id).first()

    return PrescriptionResponse(
        id=p.id,
        doctor_id=p.doctor_id,
        patient_id=p.patient_id,
        grant_id=p.grant_id,
        status=p.status,
        created_at=p.created_at,
        updated_at=p.updated_at,
        doctor_name=doctor.full_name if doctor else None,
        patient_name=patient.full_name if patient else None,
        symptoms_diagnosis=_item_section(items, "symptoms_diagnosis"),
        lab_tests=_item_section(items, "lab_tests"),
        general_advice=_item_section(items, "general_advice"),
        medications=[
            PrescriptionMedicationResponse(
                id=m.id,
                medicine_name=m.medicine_name,
                dosage_morning=m.dosage_morning,
                dosage_afternoon=m.dosage_afternoon,
                dosage_night=m.dosage_night,
                duration_days=m.duration_days,
                instructions=m.instructions,
                order=m.order,
            )
            for m in meds
        ],
    )


def _insert_children(db: Session, prescription_id: str, data: PrescriptionCreate | PrescriptionUpdate) -> None:
    for section, field in [
        ("symptoms_diagnosis", data.symptoms_diagnosis),
        ("lab_tests", data.lab_tests),
        ("general_advice", data.general_advice),
    ]:
        if field is None:
            continue
        for idx, item in enumerate(field):
            db.add(PrescriptionItem(
                prescription_id=prescription_id,
                section=section,
                content=item.content,
                order=item.order if item.order else idx,
            ))
    if data.medications is not None:
        for idx, med in enumerate(data.medications):
            db.add(PrescriptionMedication(
                prescription_id=prescription_id,
                medicine_name=med.medicine_name,
                dosage_morning=med.dosage_morning,
                dosage_afternoon=med.dosage_afternoon,
                dosage_night=med.dosage_night,
                duration_days=med.duration_days,
                instructions=med.instructions,
                order=med.order if med.order else idx,
            ))


def _replace_children(db: Session, prescription_id: str, data: PrescriptionUpdate) -> None:
    """Delete all existing child rows for updated sections, then reinsert."""
    updated_sections = set()
    if data.symptoms_diagnosis is not None:
        updated_sections.add("symptoms_diagnosis")
    if data.lab_tests is not None:
        updated_sections.add("lab_tests")
    if data.general_advice is not None:
        updated_sections.add("general_advice")

    if updated_sections:
        db.query(PrescriptionItem).filter(
            PrescriptionItem.prescription_id == prescription_id,
            PrescriptionItem.section.in_(updated_sections),
        ).delete(synchronize_session=False)

    if data.medications is not None:
        db.query(PrescriptionMedication).filter(
            PrescriptionMedication.prescription_id == prescription_id
        ).delete(synchronize_session=False)

    _insert_children(db, prescription_id, data)


def create_prescription(db: Session, doctor_id: str, patient_id: str, data: PrescriptionCreate) -> PrescriptionResponse:
    grant = require_active_grant(db, doctor_id, patient_id)
    now = datetime.now(timezone.utc)
    p = Prescription(
        doctor_id=doctor_id,
        patient_id=patient_id,
        grant_id=grant.id,
        status=data.status,
        created_at=now,
        updated_at=now,
    )
    db.add(p)
    db.flush()
    _insert_children(db, p.id, data)
    db.commit()
    db.refresh(p)
    log_audit(db, doctor_id, "prescription_created", "prescription", p.id)
    return _build_response(db, p)


def update_prescription(db: Session, doctor_id: str, prescription_id: str, data: PrescriptionUpdate) -> PrescriptionResponse:
    p = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prescription not found")
    if p.doctor_id != doctor_id:
        raise HTTPException(status_code=403, detail="Not authorised to modify this prescription")
    if p.status == "revoked":
        raise HTTPException(status_code=409, detail="Revoked prescriptions cannot be modified")

    if data.status == "revoked":
        if p.status == "draft":
            raise HTTPException(status_code=409, detail="A draft prescription must be published before it can be revoked")
        p.status = "revoked"
        p.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(p)
        log_audit(db, doctor_id, "prescription_revoked", "prescription", p.id)
        return _build_response(db, p)

    if data.status == "draft" and p.status != "draft":
        raise HTTPException(status_code=409, detail="A published prescription cannot be returned to draft")

    if data.status == "published":
        p.status = "published"

    _replace_children(db, p.id, data)
    p.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(p)
    log_audit(db, doctor_id, "prescription_updated", "prescription", p.id)
    return _build_response(db, p)


def list_doctor_prescriptions(db: Session, doctor_id: str, patient_id: str) -> list[PrescriptionListItem]:
    prescriptions = (
        db.query(Prescription)
        .filter(Prescription.doctor_id == doctor_id, Prescription.patient_id == patient_id)
        .order_by(Prescription.created_at.desc())
        .all()
    )
    doctor = db.query(User).filter(User.id == doctor_id).first()
    patient = db.query(User).filter(User.id == patient_id).first()
    return [
        PrescriptionListItem(
            id=p.id,
            doctor_id=p.doctor_id,
            patient_id=p.patient_id,
            status=p.status,
            created_at=p.created_at,
            updated_at=p.updated_at,
            doctor_name=doctor.full_name if doctor else None,
            patient_name=patient.full_name if patient else None,
        )
        for p in prescriptions
    ]


def get_prescription_for_doctor(db: Session, doctor_id: str, prescription_id: str) -> PrescriptionResponse:
    p = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not p or p.doctor_id != doctor_id:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return _build_response(db, p)


def list_patient_prescriptions(db: Session, patient_id: str) -> list[PrescriptionListItem]:
    prescriptions = (
        db.query(Prescription)
        .filter(
            Prescription.patient_id == patient_id,
            Prescription.status.in_(["published", "revoked"]),
        )
        .order_by(Prescription.created_at.desc())
        .all()
    )
    results = []
    for p in prescriptions:
        doctor = db.query(User).filter(User.id == p.doctor_id).first()
        results.append(PrescriptionListItem(
            id=p.id,
            doctor_id=p.doctor_id,
            patient_id=p.patient_id,
            status=p.status,
            created_at=p.created_at,
            updated_at=p.updated_at,
            doctor_name=doctor.full_name if doctor else None,
            patient_name=None,
        ))
    return results


def get_prescription_for_patient(db: Session, patient_id: str, prescription_id: str) -> PrescriptionResponse:
    p = db.query(Prescription).filter(Prescription.id == prescription_id).first()
    if not p or p.patient_id != patient_id or p.status == "draft":
        raise HTTPException(status_code=404, detail="Prescription not found")
    log_audit(db, patient_id, "prescription_viewed", "prescription", p.id)
    return _build_response(db, p)


def generate_prescription_pdf(prescription: PrescriptionResponse) -> bytes:
    templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
    try:
        env = Environment(loader=FileSystemLoader(templates_dir), autoescape=True)
        html = env.get_template("prescription.html").render(prescription=prescription)

        from weasyprint import HTML
        return HTML(string=html).write_pdf()
    except Exception:
        logger.exception("Prescription PDF generation failed (prescription_id=%s)", prescription.id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="PDF generation is temporarily unavailable. Please try again later.",
        )
