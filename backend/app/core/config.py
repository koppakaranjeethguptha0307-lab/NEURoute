"""
Core configuration for NEURoute backend using Pydantic Settings.
Loads configuration from environment variables with safe defaults for development.
"""

from typing import List, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


import os
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[3]
DEFAULT_DB_PATH = (ROOT_DIR / "neuroute.db").as_posix()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    # Application Metadata
    PROJECT_NAME: str = "NEURoute — NER Smart Logistics & Accessibility Intelligence Platform"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development", description="development | staging | production | testing")
    MOCK_DATA_MODE: bool = Field(default=True, description="Enable deterministic regional mock data for offline/demo operation")
    LOG_LEVEL: str = Field(default="INFO", description="Logging verbosity level")

    # Security & Authentication
    JWT_SECRET: str = Field(
        default="neuroute-secret-key-ner-sih26002-development-only-change-in-prod",
        description="HMAC secret key for JWT token signing"
    )
    JWT_ALGORITHM: str = Field(default="HS256", description="Algorithm used to sign JWT tokens")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=1440, description="Token expiration window in minutes (default: 24 hours)")

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+psycopg2://neuroute_user:neuroute_pass@localhost:5432/neuroute",
        description="Database connection string (PostgreSQL+PostGIS for production)"
    )

    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:8000",
            "https://neuroute.vercel.app",
            "https://neuroute-backend.onrender.com",
            "*"
        ],
        description="Allowed CORS origins"
    )

    # External Provider - Routing
    ROUTING_PROVIDER: str = Field(default="mock", description="Routing provider: mock | osrm")
    ROUTING_PROVIDER_URL: str = Field(default="https://router.project-osrm.org", description="OSRM routing endpoint URL")
    ROUTING_PROVIDER_API_KEY: str = Field(default="", description="API key for commercial routing services if needed")
    ROUTING_TIMEOUT_SECONDS: float = Field(default=5.0, description="Timeout for external routing API calls")

    # External Provider - Weather
    WEATHER_PROVIDER: str = Field(default="mock", description="Weather provider: mock | openmeteo")
    WEATHER_PROVIDER_URL: str = Field(default="https://api.open-meteo.com/v1", description="Open-Meteo API endpoint URL")
    WEATHER_PROVIDER_API_KEY: str = Field(default="", description="API key for weather services if needed")
    WEATHER_TIMEOUT_SECONDS: float = Field(default=5.0, description="Timeout for external weather API calls")

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v == "*" or v.strip() == "*":
                return ["*"]
            if not v.startswith("["):
                return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v  # type: ignore
        return ["*"]

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, v: str, info) -> str:
        env = info.data.get("ENVIRONMENT", "development")
        if str(env).lower() == "production":
            if "development-only" in v or "change-in-prod" in v or len(v) < 16:
                raise ValueError("CRITICAL SECURITY FAILURE: Production mode requires a secure JWT_SECRET environment variable.")
        return v

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")


# Global singleton settings instance
settings = Settings()
