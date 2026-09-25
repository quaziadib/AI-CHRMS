import logging
import os
from logging.handlers import RotatingFileHandler

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.api.v1.router import router as v1_router
from app.core.config import settings
from app.db.base import engine
from app.db.bootstrap import bootstrap_database

_LOG_HANDLERS = [logging.StreamHandler()]
if not os.environ.get("VERCEL"):
    _LOG_DIR = os.environ.get("LOG_DIR", "/tmp/logs")
    try:
        os.makedirs(_LOG_DIR, exist_ok=True)
        _LOG_HANDLERS.append(
            RotatingFileHandler(
                os.path.join(_LOG_DIR, "backend.log"),
                maxBytes=10 * 1024 * 1024,
                backupCount=5,
            )
        )
    except OSError:
        pass  # stdout-only if the log directory is not writable

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    handlers=_LOG_HANDLERS,
)
logger = logging.getLogger(__name__)

_MAX_BODY_BYTES = 10 * 1024 * 1024  # 10 MB


class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > _MAX_BODY_BYTES:
            return JSONResponse(
                {"detail": "Request body too large (max 10 MB)"},
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )
        return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up Health Project API...")
    # Always apply idempotent schema migrations (ADD COLUMN IF NOT EXISTS, etc.).
    # Seeding stays behind DB_INIT_ON_STARTUP so production does not re-seed on every boot.
    from app.db.init_db import create_tables

    create_tables()
    logger.info("Startup schema verification complete")
    if settings.DB_INIT_ON_STARTUP:
        bootstrap_database()
        logger.info("Startup database initialization complete")
    yield
    logger.info("Shutting down")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Health Data Collection and Management API",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)


app.add_middleware(BodySizeLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

app.include_router(v1_router)

@app.get("/")
def root():
    return {"message": "API is running"}

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": settings.APP_NAME, "version": settings.APP_VERSION}
