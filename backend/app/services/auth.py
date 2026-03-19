from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_token,
    verify_password,
    hash_password,
    decode_token,
)
from app.models.user import User, RefreshToken
from app.schemas.user import UserCreate, TokenResponse, UserResponse
from app.services.audit import log_audit
from jose import JWTError


def _make_token_response(user: User, db: Session) -> TokenResponse:
    access_token = create_access_token(user.id)
    refresh_token_str, jti, expires_at = create_refresh_token(user.id)

    db_token = RefreshToken(
        jti=jti,
        user_id=user.id,
        token_hash=hash_token(refresh_token_str),
        expires_at=expires_at,
    )
    db.add(db_token)
    db.commit()

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token_str,
        user=UserResponse.model_validate(user),
    )


def register_user(db: Session, data: UserCreate) -> TokenResponse:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        is_active=True,
        is_verified=False,
        roles=["user"],
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_audit(db, user.id, "register", "user", user.id)
    return _make_token_response(user, db)


def login_user(
    db: Session,
    email: str,
    password: str,
    ip_address: str | None = None,
    user_agent: str | None = None,
) -> TokenResponse:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        if user:
            log_audit(db, user.id, "login_failed", "user", user.id, status="failed",
                      ip_address=ip_address, user_agent=user_agent)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        log_audit(db, user.id, "login_failed", "user", user.id, status="failed",
                  ip_address=ip_address, user_agent=user_agent)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is disabled",
        )

    log_audit(db, user.id, "login", "user", user.id,
              ip_address=ip_address, user_agent=user_agent)
    return _make_token_response(user, db)


def refresh_access_token(db: Session, refresh_token_str: str) -> dict:
    try:
        payload = decode_token(refresh_token_str)
        user_id = payload.get("sub")
        jti = payload.get("jti")
        token_type = payload.get("type")

        if not user_id or not jti or token_type != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")

        stored = db.query(RefreshToken).filter(RefreshToken.jti == jti).first()
        if not stored:
            raise HTTPException(status_code=401, detail="Refresh token not found or revoked")

        # Rotate: delete old, issue new
        db.delete(stored)

        access_token = create_access_token(user_id)
        new_refresh_str, new_jti, new_expires = create_refresh_token(user_id)
        db.add(
            RefreshToken(
                jti=new_jti,
                user_id=user_id,
                token_hash=hash_token(new_refresh_str),
                expires_at=new_expires,
            )
        )
        db.commit()

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_str,
            "token_type": "bearer",
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
