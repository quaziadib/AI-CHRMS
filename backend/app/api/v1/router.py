from fastapi import APIRouter

from app.api.v1 import auth, users, records, admin, collector, copi, consent, datasets, chat, ml

router = APIRouter(prefix="/v1")

# Existing
router.include_router(auth.router,      prefix="/auth",       tags=["Authentication"])
router.include_router(users.router,     prefix="/users",      tags=["Users"])
router.include_router(records.router,   prefix="/records",    tags=["Records"])
router.include_router(admin.router,     prefix="/admin",      tags=["Admin"])

# New role-based
router.include_router(collector.router, prefix="/collector",  tags=["Data Collector"])
router.include_router(copi.router,      prefix="/copi",       tags=["Co-PI"])

# Feature endpoints
router.include_router(consent.router,   prefix="/consent",    tags=["Consent"])
router.include_router(datasets.router,  prefix="/datasets",   tags=["Datasets"])
router.include_router(chat.router,      prefix="/chat",       tags=["AI Chatbot"])
router.include_router(ml.router,        prefix="/ml",         tags=["ML Engineer"])
