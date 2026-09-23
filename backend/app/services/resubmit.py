from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.record import PatientRecord
from app.schemas.resubmit import HealthTrendPoint, HealthTrendsResponse, ResubmitStatusResponse
from app.services.settings import _add_months, get_resubmit_interval_months

_RISK_SCORE = {"low": 1, "moderate": 2, "high": 3}


def get_resubmit_status(db: Session, user_id: str) -> ResubmitStatusResponse:
    interval = get_resubmit_interval_months(db)
    records = (
        db.query(PatientRecord)
        .filter(PatientRecord.user_id == user_id)
        .order_by(PatientRecord.created_at.desc())
        .all()
    )
    submission_count = len(records)

    if submission_count == 0:
        return ResubmitStatusResponse(
            interval_months=interval,
            latest_submission_at=None,
            next_due_at=None,
            is_due=False,
            days_until_due=None,
            submission_count=0,
            can_submit_new=True,
            status="initial",
        )

    latest = records[0]
    latest_at = latest.created_at
    if latest_at.tzinfo is None:
        latest_at = latest_at.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    # Guard against bad/future seed timestamps breaking due math
    if latest_at > now:
        latest_at = now

    next_due = _add_months(latest_at, interval)
    is_due = now >= next_due
    days_until_due = (next_due.date() - now.date()).days

    if is_due:
        status = "due"
    elif days_until_due <= 14:
        status = "upcoming"
    else:
        status = "current"

    return ResubmitStatusResponse(
        interval_months=interval,
        latest_submission_at=latest_at,
        next_due_at=next_due,
        is_due=is_due,
        days_until_due=days_until_due,
        submission_count=submission_count,
        can_submit_new=is_due,
        status=status,
    )


def get_health_trends(db: Session, user_id: str) -> HealthTrendsResponse:
    records = (
        db.query(PatientRecord)
        .filter(PatientRecord.user_id == user_id)
        .order_by(PatientRecord.created_at.asc())
        .all()
    )
    points: list[HealthTrendPoint] = []
    for record in records:
        submitted_at = record.created_at
        if submitted_at.tzinfo is None:
            submitted_at = submitted_at.replace(tzinfo=timezone.utc)
        points.append(
            HealthTrendPoint(
                record_id=record.id,
                pid=record.pid,
                submitted_at=submitted_at,
                blood_glucose=record.blood_glucose,
                bmi=record.bmi,
                bp_systolic=record.bp_systolic,
                bp_diastolic=record.bp_diastolic,
                risk_level=record.risk_level,
                risk_score=_RISK_SCORE.get(record.risk_level or "", None),
            )
        )
    return HealthTrendsResponse(submissions=points)
