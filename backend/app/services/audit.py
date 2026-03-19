from datetime import datetime, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.audit import AuditLog
from app.models.user import User


def log_audit(
    db: Session,
    user_id: str,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    status: str = "success",
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> None:
    user = db.query(User).filter(User.id == user_id).first()
    log = AuditLog(
        user_id=user_id,
        user_email=user.email if user else None,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        ip_address=ip_address,
        user_agent=user_agent,
        status=status,
    )
    db.add(log)
    db.commit()
