from fastapi import APIRouter

from app.api.deps import CurrentUser, DB
from app.schemas.user import UserResponse, UserUpdate, PasswordChange
from app.services import user as user_service

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def get_profile(current_user: CurrentUser):
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
def update_profile(data: UserUpdate, current_user: CurrentUser, db: DB):
    return user_service.update_profile(db, current_user.id, data)


@router.post("/me/change-password")
def change_password(data: PasswordChange, current_user: CurrentUser, db: DB):
    user_service.change_password(db, current_user.id, data.current_password, data.new_password)
    return {"message": "Password changed successfully"}
