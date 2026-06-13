from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.health_snapshot import HealthSnapshot
from app.models.record import PatientRecord


def capture_health_snapshot(db: Session, record: PatientRecord) -> None:
    db.add(
        HealthSnapshot(
            record_id=record.id,
            blood_glucose=record.blood_glucose,
            bmi=record.bmi,
        )
    )
    db.commit()
