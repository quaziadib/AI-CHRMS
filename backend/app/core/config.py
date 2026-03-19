from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_WEAK_SECRETS = {
    "change-this-secret-in-production-min-32-chars",
    "your-super-secret-key-change-in-production",
    "secret",
    "password",
}


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Health Project API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://healthadmin:healthpass123@localhost:5432/healthdb"

    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3001", "http://localhost:3000"]

    # Seed credentials (used only on first startup)
    ADMIN_EMAIL: str = "admin@health.local"
    ADMIN_PASSWORD: str = "admin123"
    DEMO_EMAIL: str = "demo@health.local"
    DEMO_PASSWORD: str = "demo123"

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
