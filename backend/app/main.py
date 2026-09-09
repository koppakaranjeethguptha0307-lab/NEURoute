"""
Main FastAPI Application Entry Point for NEURoute Backend.
Configures lifespan events, CORS, RequestContext middleware, health endpoints, AI routers, and database initialization.
"""

import uvicorn
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.database.session import init_db
from app.dependencies import get_health_service
from app.middleware.request_context import RequestContextMiddleware
from app.schemas.health import HealthCheckResponse
from app.services.health_service import HealthService
from backend.app.api.routes import ai


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Lifespan context manager for application startup and shutdown tasks."""
    # Setup structured logging
    setup_logging(log_level=settings.LOG_LEVEL)
    logger.info(
        f"Starting {settings.PROJECT_NAME} (v{settings.PROJECT_VERSION}) in {settings.ENVIRONMENT} mode",
        extra={"service": "main", "status": "STARTING"}
    )

    # Initialize database tables
    try:
        init_db()
    except Exception as e:
        logger.critical(f"Database initialization failed during startup: {str(e)}")

    yield

    logger.info("Shutting down NEURoute application", extra={"service": "main", "status": "SHUTDOWN"})


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Request context, correlation ID, timing and domain exception handling
app.add_middleware(RequestContextMiddleware)

# Cross-Origin Resource Sharing (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(ai.router)


@app.get("/health", response_model=HealthCheckResponse, tags=["System Health"])
def health_check(health_service: HealthService = Depends(get_health_service)) -> HealthCheckResponse:
    """System health inspection and readiness probe."""
    return health_service.check_health()


@app.get("/", tags=["Root"])
def root() -> dict:
    """Root metadata endpoint."""
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": f"{settings.API_V1_STR}/docs",
        "mock_mode": settings.MOCK_DATA_MODE,
    }


if __name__ == "__main__":
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)

