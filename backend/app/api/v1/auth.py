from fastapi import APIRouter, Request

from app.api.deps import CurrentUser, DB
from app.schemas.user import TokenResponse, UserCreate, UserLogin, RefreshTokenRequest, UserResponse
from app.services import auth as auth_service
from app.services.audit import log_audit

router = APIRouter()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    return forwarded.split(",")[0].strip() if forwarded else request.client.host


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: UserCreate, request: Request, db: DB):
    result = auth_service.register_user(db, data)
    log_audit(
        db, result.user.id, "register", "user", result.user.id,
        ip_address=_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return result


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, request: Request, db: DB):
    result = auth_service.login_user(
        db, data.email, data.password,
        ip_address=_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return result


@router.post("/refresh")
def refresh(data: RefreshTokenRequest, db: DB):
    return auth_service.refresh_access_token(db, data.refresh_token)


@router.post("/logout")
def logout(current_user: CurrentUser, db: DB):
    log_audit(db, current_user.id, "logout", "user", current_user.id)
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: CurrentUser):
    return UserResponse.model_validate(current_user)
