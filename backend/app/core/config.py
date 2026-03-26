from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_WEAK_SECRETS = {
    "change-this-secret-in-production-min-32-chars",
    "your-super-secret-key-change-in-production",
    "secret",
    "password",
}

# All system roles
ROLES = {
    "admin",
    "co_pi",
    "data_collector",
    "ml_engineer",
    "patient",
    "user",
}


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "AI-CHRMS API"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://healthadmin:healthpass123@localhost:5432/healthdb"

    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Redis + Celery
    REDIS_URL: str = "redis://localhost:6379/0"

    # OpenAI (optional — chatbot disabled if not set)
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Field-level encryption key (Fernet — 32-byte base64; generated if empty → dev only)
    FIELD_ENCRYPTION_KEY: str = ""

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3001", "http://localhost:3000"]

    # Seed credentials
    ADMIN_EMAIL: str = "admin@chrms.local"
    ADMIN_PASSWORD: str = "Admin@123!"
    COPI_EMAIL: str = "copi@chrms.local"
    COPI_PASSWORD: str = "CoPi@123!"
    COLLECTOR_EMAIL: str = "collector@chrms.local"
    COLLECTOR_PASSWORD: str = "Collector@123!"
    ML_EMAIL: str = "ml@chrms.local"
    ML_PASSWORD: str = "MlEng@123!"
    DEMO_EMAIL: str = "demo@chrms.local"
    DEMO_PASSWORD: str = "Demo@123!"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters")
        if v in _WEAK_SECRETS:
            raise ValueError("JWT_SECRET_KEY is using a known-weak default — set a unique secret in .env")
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
