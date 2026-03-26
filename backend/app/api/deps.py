from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/v1/auth/login")


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(token)
        user_id: str | None = payload.get("sub")
        token_type: str | None = payload.get("type")
        if not user_id or token_type != "access":
            raise credentials_exception
    except JWTError as exc:
        raise credentials_exception from exc

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


def _require_role(*roles: str):
    """Return a dependency that enforces at least one of the given roles."""
    def checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if all(r not in current_user.roles for r in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access requires one of: {', '.join(roles)}",
            )
        return current_user
    return checker


def get_admin_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if "admin" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user


def get_copi_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if all(r not in current_user.roles for r in ("admin", "co_pi")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Co-PI access required")
    return current_user


def get_collector_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if all(r not in current_user.roles for r in ("admin", "co_pi", "data_collector")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Data Collector access required")
    return current_user


def get_ml_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if all(r not in current_user.roles for r in ("admin", "ml_engineer")):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ML Engineer access required")
    return current_user


def get_patient_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if "patient" not in current_user.roles:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Patient access required")
    return current_user


# Typed aliases
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(get_admin_user)]
CoPIUser = Annotated[User, Depends(get_copi_user)]
CollectorUser = Annotated[User, Depends(get_collector_user)]
MLUser = Annotated[User, Depends(get_ml_user)]
PatientUser = Annotated[User, Depends(get_patient_user)]
DB = Annotated[Session, Depends(get_db)]
