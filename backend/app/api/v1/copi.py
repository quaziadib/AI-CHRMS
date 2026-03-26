"""Co-PI endpoints.

Allowed roles: co_pi, admin
"""

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import CoPIUser, DB
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserResponse
from app.services.audit import log_audit

router = APIRouter()


# ── Data Collector management ─────────────────────────────────────────────────

@router.get("/collectors", response_model=list[UserResponse])
def list_collectors(
    current_user: CoPIUser,
    db: DB,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    """List all Data Collector accounts."""
    return (
        db.query(User)
        .filter(User.roles.contains(["data_collector"]))
        .order_by(User.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.post("/collectors", response_model=UserResponse, status_code=201)
def create_collector(
    body: dict,
    current_user: CoPIUser,
    db: DB,
):
    """Provision a new Data Collector account.

    Body: { email, full_name, password, phone? }
    """
    email: str = body.get("email", "").strip().lower()
    full_name: str = body.get("full_name", "").strip()
    password: str = body.get("password", "")
    phone: str | None = body.get("phone")

    if not email or not full_name or not password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="email, full_name, and password are required",
        )
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=email,
        password_hash=hash_password(password),
        full_name=full_name,
        phone=phone,
        roles=["data_collector"],
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_audit(db, current_user.id, "collector_created", "user", user.id)
    return user


@router.patch("/collectors/{user_id}/deactivate", response_model=UserResponse)
def deactivate_collector(
    user_id: str,
    current_user: CoPIUser,
    db: DB,
):
    """Deactivate a Data Collector account."""
    user = db.query(User).filter(User.id == user_id, User.roles.contains(["data_collector"])).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collector not found")
    user.is_active = False
    db.commit()
    db.refresh(user)
    log_audit(db, current_user.id, "collector_deactivated", "user", user_id)
    return user


@router.patch("/collectors/{user_id}/activate", response_model=UserResponse)
def activate_collector(
    user_id: str,
    current_user: CoPIUser,
    db: DB,
):
    """Re-activate a Data Collector account."""
    user = db.query(User).filter(User.id == user_id, User.roles.contains(["data_collector"])).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collector not found")
    user.is_active = True
    db.commit()
    db.refresh(user)
    log_audit(db, current_user.id, "collector_activated", "user", user_id)
    return user
