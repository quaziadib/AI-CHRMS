from fastapi import APIRouter

from app.api.v1 import auth, users, records, admin, doctor, chat, national

router = APIRouter(prefix="/v1")
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(records.router, prefix="/records", tags=["Records"])
router.include_router(admin.router, prefix="/admin", tags=["Admin"])
router.include_router(doctor.router, prefix="/doctor", tags=["Doctor"])
router.include_router(chat.router, prefix="/chat", tags=["Chat"])
router.include_router(national.router, prefix="/national", tags=["National"])
