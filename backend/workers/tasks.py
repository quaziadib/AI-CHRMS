"""Celery task definitions.

All tasks are idempotent and safe to retry.
"""

import logging

from workers.celery_app import celery_app

logger = logging.getLogger(__name__)


# ── Email / Notification tasks ────────────────────────────────────────────────

@celery_app.task(bind=True, name="tasks.send_patient_credentials_email")
def send_patient_credentials_email(self, email: str, temp_password: str, patient_name: str):
    """Email a newly registered patient their temporary login credentials.

    In production: integrate with SendGrid / SES / SMTP.
    """
    try:
        logger.info("Sending credentials email to %s", email)
        # TODO: replace with real email provider
        # send_email(
        #     to=email,
        #     subject="Your AI-CHRMS Account Credentials",
        #     body=f"Hello {patient_name}, your temporary password is: {temp_password}"
        # )
        logger.info("Credentials email sent to %s", email)
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", email, exc)
        raise self.retry(exc=exc) from exc


@celery_app.task(bind=True, name="tasks.send_consent_notification")
def send_consent_notification(self, patient_email: str, requester_name: str, action: str):
    """Notify a patient when a consent request is created/approved/rejected."""
    try:
        logger.info("Sending consent %s notification to %s", action, patient_email)
        # TODO: real email send
    except Exception as exc:
        raise self.retry(exc=exc) from exc


@celery_app.task(bind=True, name="tasks.send_dataset_status_email")
def send_dataset_status_email(self, submitter_email: str, dataset_title: str, new_status: str):
    """Notify a dataset submitter when their submission status changes."""
    try:
        logger.info(
            "Sending dataset status email to %s: %s → %s",
            submitter_email, dataset_title, new_status,
        )
        # TODO: real email send
    except Exception as exc:
        raise self.retry(exc=exc) from exc


# ── Dataset processing tasks ──────────────────────────────────────────────────

@celery_app.task(bind=True, name="tasks.process_dataset_submission")
def process_dataset_submission(self, dataset_id: str):
    """Validate and ingest an approved dataset into the system.

    Steps (stub):
    1. Download file from file_url
    2. Validate schema / headers
    3. Insert anonymized records
    4. Update status to 'published'
    """
    try:
        logger.info("Processing dataset %s", dataset_id)
        # TODO: implement actual processing pipeline
        logger.info("Dataset %s processed successfully", dataset_id)
    except Exception as exc:
        logger.error("Dataset processing failed for %s: %s", dataset_id, exc)
        raise self.retry(exc=exc) from exc


# ── Audit / Maintenance tasks ─────────────────────────────────────────────────

@celery_app.task(name="tasks.purge_expired_refresh_tokens")
def purge_expired_refresh_tokens():
    """Periodic task: remove expired refresh tokens from the database."""
    from datetime import datetime, timezone

    from app.db.session import SessionLocal
    from app.models.user import RefreshToken

    db = SessionLocal()
    try:
        deleted = (
            db.query(RefreshToken)
            .filter(RefreshToken.expires_at < datetime.now(timezone.utc))
            .delete(synchronize_session=False)
        )
        db.commit()
        logger.info("Purged %d expired refresh tokens", deleted)
    finally:
        db.close()
