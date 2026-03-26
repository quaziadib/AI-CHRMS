from sqlalchemy.orm import Session

from app.models.record import PatientRecord


def _anonymize(record: PatientRecord) -> dict:
    """Strip all PII — return only health metrics safe for ML use."""
    return {
        # Demographics (no names/IDs)
        "age": record.age,
        "gender": record.gender,
        "district": record.district,
        # Family history
        "family_diabetes": record.family_diabetes,
        "family_hypertension": record.family_hypertension,
        "family_cvd": record.family_cvd,
        "family_stroke": record.family_stroke,
        # Medical history
        "diabetes_history": record.diabetes_history,
        "hypertension": record.hypertension,
        "cvd": record.cvd,
        "stroke": record.stroke,
        "pregnancies": record.pregnancies,
        # Vital signs
        "bp_systolic": record.bp_systolic,
        "bp_diastolic": record.bp_diastolic,
        "height": record.height,
        "weight": record.weight,
        "bmi": record.bmi,
        "pulse_rate": record.pulse_rate,
        # Lab tests
        "blood_glucose": record.blood_glucose,
        "cholesterol": record.cholesterol,
        "hemoglobin": record.hemoglobin,
        "creatinine": record.creatinine,
        "ecg_result": record.ecg_result,
        # Lifestyle
        "smoking": record.smoking,
        "physical_activity": record.physical_activity,
        "alcohol": record.alcohol,
        "sleep_hours": record.sleep_hours,
        "sound_sleep": record.sound_sleep,
        # Target / labels
        "diagnosis": record.diagnosis,
    }


def get_anonymized_dataset(
    db: Session,
    skip: int = 0,
    limit: int = 500,
    verified_only: bool = True,
) -> dict:
    q = db.query(PatientRecord)
    if verified_only:
        q = q.filter(PatientRecord.is_verified == True)  # noqa: E712
    records = q.offset(skip).limit(limit).all()
    total = db.query(PatientRecord).count()
    return {
        "total": total,
        "returned": len(records),
        "skip": skip,
        "limit": limit,
        "data": [_anonymize(r) for r in records],
    }
