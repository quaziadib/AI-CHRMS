from fastapi import APIRouter

from app.api.v1 import auth, users, records, admin

router = APIRouter(prefix="/v1")
router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(records.router, prefix="/records", tags=["Records"])
router.include_router(admin.router, prefix="/admin", tags=["Admin"])
