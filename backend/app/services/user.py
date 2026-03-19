from datetime import datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.audit import log_audit


def get_user_or_404(db: Session, user_id: str) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def update_profile(db: Session, user_id: str, data: UserUpdate) -> UserResponse:
    user = get_user_or_404(db, user_id)
    updates = data.model_dump(exclude_none=True)
    for field, value in updates.items():
        setattr(user, field, value)
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    log_audit(db, user_id, "update_profile", "user", user_id)
    return UserResponse.model_validate(user)


def change_password(db: Session, user_id: str, current_password: str, new_password: str) -> None:
    user = get_user_or_404(db, user_id)
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    log_audit(db, user_id, "change_password", "user", user_id)
