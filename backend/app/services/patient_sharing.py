from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.patient_sharing import (
    DoctorInteraction,
    PatientAccessEvent,
    PatientDoctorGrant,
    PatientMedication,
)
from app.models.record import PatientRecord
from app.models.user import User
from app.schemas.patient_sharing import (
    AccessEventResponse,
    DoctorOption,
    DoctorPatientListItem,
    DoctorPatientProfileResponse,
    InteractionCreate,
    InteractionResponse,
    MedicationCreate,
    MedicationResponse,
    PatientGrantResponse,
)
from app.schemas.record import PatientRecordResponse


def _record_event(db: Session, grant: PatientDoctorGrant, actor_id: str, event_type: str) -> None:
    db.add(PatientAccessEvent(
        grant_id=grant.id,
        patient_id=grant.patient_id,
        doctor_id=grant.doctor_id,
        actor_id=actor_id,
        event_type=event_type,
    ))


def record_profile_event(db: Session, grant: PatientDoctorGrant, doctor_id: str, event_type: str) -> None:
    _record_event(db, grant, doctor_id, event_type)
    db.commit()


def _grant_response(db: Session, grant: PatientDoctorGrant) -> PatientGrantResponse:
    patient = db.query(User).filter(User.id == grant.patient_id).first()
    doctor = db.query(User).filter(User.id == grant.doctor_id).first()
    return PatientGrantResponse(
        id=grant.id,
        patient_id=grant.patient_id,
        doctor_id=grant.doctor_id,
        doctor_name=doctor.full_name if doctor else None,
        patient_name=patient.full_name if patient else None,
        status=grant.status,
        created_at=grant.created_at,
        responded_at=grant.responded_at,
        revoked_at=grant.revoked_at,
    )


def list_doctors(db: Session) -> list[DoctorOption]:
    doctors = db.query(User).filter(User.roles.contains(["doctor"]), User.is_active.is_(True))
    return [DoctorOption(id=d.id, full_name=d.full_name, email=d.email)
            for d in doctors.order_by(User.full_name.asc()).all()]


def create_grant(db: Session, patient_id: str, doctor_id: str) -> PatientGrantResponse:
    doctor = db.query(User).filter(User.id == doctor_id).first()
    if not doctor or "doctor" not in (doctor.roles or []) or not doctor.is_active:
        raise HTTPException(status_code=400, detail="User is not an active doctor")
    current = db.query(PatientDoctorGrant).filter(
        PatientDoctorGrant.patient_id == patient_id,
        PatientDoctorGrant.doctor_id == doctor_id,
        PatientDoctorGrant.status.in_(["pending", "active"]),
    ).first()
    if current:
        raise HTTPException(status_code=409, detail="A pending or active grant already exists")

    grant = PatientDoctorGrant(patient_id=patient_id, doctor_id=doctor_id, status="pending")
    db.add(grant)
    try:
        db.flush()
        _record_event(db, grant, patient_id, "grant_requested")
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="A pending or active grant already exists")
    db.refresh(grant)
    return _grant_response(db, grant)


def list_patient_grants(db: Session, patient_id: str) -> list[PatientGrantResponse]:
    grants = db.query(PatientDoctorGrant).filter(
        PatientDoctorGrant.patient_id == patient_id
    ).order_by(PatientDoctorGrant.created_at.desc()).all()
    return [_grant_response(db, grant) for grant in grants]


def list_doctor_requests(db: Session, doctor_id: str) -> list[PatientGrantResponse]:
    grants = db.query(PatientDoctorGrant).filter(
        PatientDoctorGrant.doctor_id == doctor_id,
        PatientDoctorGrant.status == "pending",
    ).order_by(PatientDoctorGrant.created_at.asc()).all()
    return [_grant_response(db, grant) for grant in grants]


def decide_grant(db: Session, doctor_id: str, grant_id: str, decision: str) -> PatientGrantResponse:
    grant = db.query(PatientDoctorGrant).filter(
        PatientDoctorGrant.id == grant_id,
        PatientDoctorGrant.doctor_id == doctor_id,
    ).with_for_update().first()
    if not grant:
        raise HTTPException(status_code=404, detail="Access request not found")
    if grant.status != "pending":
        raise HTTPException(status_code=409, detail="Access request is no longer pending")
    grant.status = "active" if decision == "accept" else "declined"
    grant.responded_at = datetime.now(timezone.utc)
    _record_event(db, grant, doctor_id, "grant_declined" if decision == "decline" else "grant_accepted")
    db.commit()
    db.refresh(grant)
    return _grant_response(db, grant)


def revoke_grant(db: Session, patient_id: str, grant_id: str) -> PatientGrantResponse:
    grant = db.query(PatientDoctorGrant).filter(
        PatientDoctorGrant.id == grant_id,
        PatientDoctorGrant.patient_id == patient_id,
    ).with_for_update().first()
    if not grant:
        raise HTTPException(status_code=404, detail="Access grant not found")
    if grant.status != "active":
        raise HTTPException(status_code=409, detail="Only active access can be revoked")
    grant.status = "revoked"
    grant.revoked_at = datetime.now(timezone.utc)
    _record_event(db, grant, patient_id, "grant_revoked")
    db.commit()
    db.refresh(grant)
    return _grant_response(db, grant)


def require_active_grant(db: Session, doctor_id: str, patient_id: str) -> PatientDoctorGrant:
    grant = db.query(PatientDoctorGrant).filter(
        PatientDoctorGrant.doctor_id == doctor_id,
        PatientDoctorGrant.patient_id == patient_id,
        PatientDoctorGrant.status == "active",
    ).first()
    if not grant:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    return grant


def _enrich_record(db: Session, record: PatientRecord, patient_name: str) -> PatientRecordResponse:
    response = PatientRecordResponse.model_validate(record)
    response.patient_name = patient_name
    return response


def _interaction_response(db: Session, interaction: DoctorInteraction) -> InteractionResponse:
    doctor = db.query(User).filter(User.id == interaction.doctor_id).first()
    return InteractionResponse(
        id=interaction.id,
        patient_id=interaction.patient_id,
        doctor_id=interaction.doctor_id,
        doctor_name=doctor.full_name if doctor else None,
        interaction_at=interaction.interaction_at,
        note=interaction.note,
        created_at=interaction.created_at,
    )


def get_doctor_profile(db: Session, doctor_id: str, patient_id: str) -> DoctorPatientProfileResponse:
    grant = require_active_grant(db, doctor_id, patient_id)
    patient = db.query(User).filter(User.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    records = db.query(PatientRecord).filter(
        PatientRecord.user_id == patient_id
    ).order_by(PatientRecord.created_at.desc()).all()
    medications = db.query(PatientMedication).filter(
        PatientMedication.patient_id == patient_id
    ).order_by(PatientMedication.start_date.desc().nullslast(), PatientMedication.created_at.desc()).all()
    interactions = db.query(DoctorInteraction).filter(
        DoctorInteraction.patient_id == patient_id
    ).order_by(DoctorInteraction.interaction_at.desc()).all()
    _record_event(db, grant, doctor_id, "profile_viewed")
    db.commit()
    record_responses = [_enrich_record(db, record, patient.full_name) for record in records]
    interaction_responses = [_interaction_response(db, row) for row in interactions]
    return DoctorPatientProfileResponse(
        patient_id=patient_id,
        patient_name=patient.full_name,
        latest_record=record_responses[0] if record_responses else None,
        records=record_responses,
        medications=[MedicationResponse.model_validate(row) for row in medications],
        interactions=interaction_responses,
    )


def matches_doctor_list_filters(
    latest: PatientRecord | None,
    *,
    risk_level: str | None = None,
    district: str | None = None,
) -> bool:
    """Return whether a patient's latest record matches optional list filters."""
    if risk_level and not (latest and latest.risk_level == risk_level):
        return False
    district_filter = district.strip() if district else None
    if district_filter and not (latest and latest.district == district_filter):
        return False
    return True


def list_doctor_profiles(
    db: Session,
    doctor_id: str,
    risk_level: str | None = None,
    district: str | None = None,
) -> list[DoctorPatientListItem]:
    grants = db.query(PatientDoctorGrant).filter(
        PatientDoctorGrant.doctor_id == doctor_id,
        PatientDoctorGrant.status == "active",
    ).all()
    result: list[DoctorPatientListItem] = []
    for grant in grants:
        patient = db.query(User).filter(User.id == grant.patient_id).first()
        latest = db.query(PatientRecord).filter(
            PatientRecord.user_id == grant.patient_id
        ).order_by(PatientRecord.created_at.desc()).first()
        if not patient:
            continue
        if not matches_doctor_list_filters(latest, risk_level=risk_level, district=district):
            continue
        result.append(DoctorPatientListItem(
            patient_id=grant.patient_id,
            patient_name=patient.full_name,
            latest_record=_enrich_record(db, latest, patient.full_name) if latest else None,
        ))
        _record_event(db, grant, doctor_id, "patient_summary_viewed")
    db.commit()
    return result


def add_interaction(
    db: Session, doctor_id: str, patient_id: str, data: InteractionCreate
) -> InteractionResponse:
    require_active_grant(db, doctor_id, patient_id)
    if not data.note.strip():
        raise HTTPException(status_code=422, detail="Interaction note cannot be empty")
    row = DoctorInteraction(
        patient_id=patient_id,
        doctor_id=doctor_id,
        note=data.note.strip(),
        interaction_at=data.interaction_at or datetime.now(timezone.utc),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _interaction_response(db, row)


def list_patient_interactions(db: Session, patient_id: str) -> list[InteractionResponse]:
    rows = db.query(DoctorInteraction).filter(
        DoctorInteraction.patient_id == patient_id
    ).order_by(DoctorInteraction.interaction_at.desc()).all()
    return [_interaction_response(db, row) for row in rows]


def list_medications(db: Session, patient_id: str) -> list[MedicationResponse]:
    rows = db.query(PatientMedication).filter(
        PatientMedication.patient_id == patient_id
    ).order_by(PatientMedication.start_date.desc().nullslast(), PatientMedication.created_at.desc()).all()
    return [MedicationResponse.model_validate(row) for row in rows]


def create_medication(db: Session, patient_id: str, data: MedicationCreate) -> MedicationResponse:
    if data.start_date and data.end_date and data.end_date < data.start_date:
        raise HTTPException(status_code=422, detail="End date must be on or after start date")
    row = PatientMedication(patient_id=patient_id, **data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return MedicationResponse.model_validate(row)


def update_medication(
    db: Session, patient_id: str, medication_id: str, data: MedicationCreate
) -> MedicationResponse:
    row = db.query(PatientMedication).filter(
        PatientMedication.id == medication_id,
        PatientMedication.patient_id == patient_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Medication history entry not found")
    if data.start_date and data.end_date and data.end_date < data.start_date:
        raise HTTPException(status_code=422, detail="End date must be on or after start date")
    for field, value in data.model_dump().items():
        setattr(row, field, value)
    db.commit()
    db.refresh(row)
    return MedicationResponse.model_validate(row)


def delete_medication(db: Session, patient_id: str, medication_id: str) -> None:
    row = db.query(PatientMedication).filter(
        PatientMedication.id == medication_id,
        PatientMedication.patient_id == patient_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Medication history entry not found")
    db.delete(row)
    db.commit()


def list_access_events(
    db: Session, patient_id: str | None = None, skip: int = 0, limit: int = 100
) -> list[AccessEventResponse]:
    query = db.query(PatientAccessEvent)
    if patient_id:
        query = query.filter(PatientAccessEvent.patient_id == patient_id)
    rows = query.order_by(PatientAccessEvent.occurred_at.desc()).offset(skip).limit(limit).all()
    result = []
    for row in rows:
        patient = db.query(User).filter(User.id == row.patient_id).first()
        doctor = db.query(User).filter(User.id == row.doctor_id).first()
        actor = db.query(User).filter(User.id == row.actor_id).first()
        result.append(AccessEventResponse(
            id=row.id,
            grant_id=row.grant_id,
            patient_id=row.patient_id,
            patient_name=patient.full_name if patient else None,
            doctor_id=row.doctor_id,
            doctor_name=doctor.full_name if doctor else None,
            actor_id=row.actor_id,
            actor_name=actor.full_name if actor else None,
            event_type=row.event_type,
            occurred_at=row.occurred_at,
        ))
    return result
