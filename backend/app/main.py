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
from app.dependencies import get_health_service, require_any_role, get_current_active_user
from app.schemas.enums import UserRole
from app.middleware.request_context import RequestContextMiddleware
from app.schemas.health import HealthCheckResponse
from app.services.health_service import HealthService
from app.api.routes import admin, ai, alerts, analytics, auth, events, gis, government, incidents, routes, shipments, simulation, telematics, vehicles



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
cors_origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:.*|http://127\.0\.0\.1:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers adhering strictly to /api/v1/*
app.include_router(auth.router) # Unprotected, self-managed
app.include_router(admin.router) # Admin RBAC protected internally
app.include_router(shipments.router, dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.LOGISTICS_PLANNER, UserRole.DRIVER]))])
app.include_router(vehicles.router, dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.LOGISTICS_PLANNER, UserRole.DRIVER]))])
app.include_router(incidents.router, dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.FIELD_OFFICER, UserRole.LOGISTICS_PLANNER]))])
app.include_router(gis.router, dependencies=[Depends(get_current_active_user)]) # All authenticated users
app.include_router(routes.router, dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.LOGISTICS_PLANNER, UserRole.DRIVER]))])
app.include_router(alerts.router, dependencies=[Depends(get_current_active_user)])
app.include_router(analytics.router, dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.LOGISTICS_PLANNER]))])
app.include_router(ai.router, dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.LOGISTICS_PLANNER]))])
app.include_router(simulation.router, dependencies=[Depends(require_any_role([UserRole.ADMIN]))])
app.include_router(events.router, dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.LOGISTICS_PLANNER]))])
app.include_router(telematics.router, dependencies=[Depends(require_any_role([UserRole.ADMIN, UserRole.LOGISTICS_PLANNER]))])
app.include_router(government.router, dependencies=[Depends(require_any_role([UserRole.ADMIN]))])

from app.dependencies import get_gis_service
from app.services.gis_service import GISService

@app.get("/api/v1/roads", tags=["GIS & Spatial Infrastructure"], dependencies=[Depends(get_current_active_user)])
def get_roads_alias(service: GISService = Depends(get_gis_service)):
    return service.get_road_segments_geojson()

@app.get("/api/v1/hazards", tags=["GIS & Spatial Infrastructure"], dependencies=[Depends(get_current_active_user)])
def get_hazards_alias(service: GISService = Depends(get_gis_service)):
    return gis.get_hazards(service)

@app.get("/api/v1/hubs", tags=["GIS & Spatial Infrastructure"], dependencies=[Depends(get_current_active_user)])
def get_hubs_alias(service: GISService = Depends(get_gis_service)):
    return gis.get_hubs(service)

# Additional resilient login route aliases
@app.post("/auth/login", response_model=auth.TokenResponse, tags=["Authentication & Identity"])
@app.post("/login", response_model=auth.TokenResponse, tags=["Authentication & Identity"])
def login_route_alias(
    credentials: auth.LoginRequest,
    auth_service: auth.AuthService = Depends(auth.get_auth_service),
) -> auth.TokenResponse:
    return auth.login(credentials=credentials, auth_service=auth_service)




@app.get("/health", response_model=HealthCheckResponse, tags=["System Health"])
@app.get("/api/v1/health", response_model=HealthCheckResponse, tags=["System Health"])
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
    import os
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run("app.main:app", host=host, port=port, reload=False)

