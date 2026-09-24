from functools import lru_cache
import os

from pydantic import field_validator, model_validator
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
    APP_ENV: str = "development"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "postgresql://healthadmin:healthpass123@localhost:5432/healthdb"

    # Security
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # LLM
    LLM_PROVIDER: str = "anthropic"  # "openai" | "anthropic" | "google" | "groq"
    LLM_MODEL: str | None = None
    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None
    GROQ_API_KEY: str | None = None
    ENABLE_RECOMMENDATIONS: bool = True
    ENABLE_CHATBOT: bool = True
    ENABLE_RAG: bool = True
    ENABLE_EHR_SUMMARY: bool = True
    ENABLE_PERSONALIZED_PLANS: bool = True
    ENABLE_FORECASTING: bool = True
    ENABLE_NATIONAL_ANALYTICS: bool = True
    ENABLE_POPULATION_FORECASTING: bool = True
    ENABLE_PATTERN_DISCOVERY: bool = True
    ENABLE_NATIONAL_INDIVIDUAL_PREDICTOR: bool = True
    NATIONAL_MIN_CELL_SIZE: int = 5
    # Resource conversion: units per projected high-risk case
    NATIONAL_KITS_PER_HIGH_RISK: float = 2.0
    NATIONAL_MEDICINE_PACKS_PER_HIGH_RISK: float = 1.0
    NATIONAL_CLINIC_CAPACITY_PER_SITE: int = 500
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    REDIS_URL: str = "redis://localhost:6379/0"
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 0
    DB_INIT_ON_STARTUP: bool = True
    RESUBMIT_INTERVAL_MONTHS_DEFAULT: int = 6

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3001", "http://localhost:3000"]

    # Seed credentials (used only on first startup)
    ADMIN_EMAIL: str = "admin@health.local"
    ADMIN_PASSWORD: str = "admin123"
    DEMO_EMAIL: str = "demo@health.local"
    DEMO_PASSWORD: str = "demo123"
    SEED_DEMO_USERS: bool = True

    # When true, seed 50 synthetic patients (patient001–050) on startup
    SEED_SYNTHETIC_DATA: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        if len(v) < 32:
            raise ValueError("JWT_SECRET_KEY must be at least 32 characters")
        if v in _WEAK_SECRETS:
            raise ValueError("JWT_SECRET_KEY is using a known-weak default — set a unique secret in .env")
        return v

    @model_validator(mode="after")
    def validate_production_settings(self):
        deployed_environment = os.environ.get("VERCEL_ENV") in {"production", "preview"}
        if self.APP_ENV.lower() == "production" or deployed_environment:
            if self.ADMIN_EMAIL.endswith((".local", "example.com", "your-domain.com")):
                raise ValueError("ADMIN_EMAIL must use a real domain in production")
            if len(self.ADMIN_PASSWORD) < 16 or self.ADMIN_PASSWORD == "admin123":
                raise ValueError("Set a unique ADMIN_PASSWORD of at least 16 characters in production")
            if "localhost" in self.DATABASE_URL or "<" in self.DATABASE_URL or ">" in self.DATABASE_URL:
                raise ValueError("Set a real production DATABASE_URL before deployment")
            if "sslmode=require" not in self.DATABASE_URL:
                raise ValueError("DATABASE_URL must require TLS in production")
            if self.DEBUG:
                raise ValueError("DEBUG must be false in production")
            if self.SEED_DEMO_USERS:
                raise ValueError("SEED_DEMO_USERS must be false in production")
            if self.SEED_SYNTHETIC_DATA:
                raise ValueError("SEED_SYNTHETIC_DATA must be false in production")
            if self.DB_INIT_ON_STARTUP:
                raise ValueError("Run the database bootstrap once, then set DB_INIT_ON_STARTUP=false")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
