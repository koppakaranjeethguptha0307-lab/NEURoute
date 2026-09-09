"""
FastAPI Dependency Injection Providers.
Exposes standard dependencies for database sessions, current user context, RBAC validation,
repositories, external adapters, and domain business services.
"""

from typing import Callable, List, Optional
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.adapters.ai.ai_adapter import AIIntegrationAdapter
from app.adapters.routing.base import RoutingProviderProtocol
from app.adapters.routing.mock_routing import MockRoutingAdapter
from app.adapters.routing.osrm_adapter import OSRMRoutingAdapter
from app.adapters.weather.base import WeatherProviderProtocol
from app.adapters.weather.mock_weather import MockWeatherAdapter
from app.adapters.weather.openmeteo_adapter import OpenMeteoWeatherAdapter
from app.core.config import settings
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.database.session import get_db
from app.repositories import (
    AlertRepository,
    AuditRepository,
    DistrictRepository,
    IncidentRepository,
    PredictionRepository,
    RoadRepository,
    RouteRepository,
    ShipmentRepository,
    UserRepository,
    VehicleRepository,
)
from app.schemas.auth import UserContext
from app.schemas.enums import UserRole
from app.services import (
    AIService,
    AlertService,
    AuditService,
    AuthService,
    GISService,
    HealthService,
    IncidentService,
    RouteOrchestrator,
    ShipmentService,
    VehicleService,
)

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)


# ==============================================================================
# Security & Current User Dependencies
# ==============================================================================

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> UserContext:
    """Resolve and validate the active user from the JWT Bearer token."""
    raw_token = token
    if not raw_token and authorization and authorization.startswith("Bearer "):
        raw_token = authorization.split(" ", 1)[1]

    if not raw_token:
        raise AuthenticationError("Authentication token is required")

    auth_service = AuthService(db)
    return auth_service.get_current_user_from_token(raw_token)


def get_current_active_user(
    current_user: UserContext = Depends(get_current_user),
) -> UserContext:
    """Verify that current user account is active."""
    if not current_user.is_active:
        raise AuthenticationError("User account is inactive")
    return current_user


def require_role(required_role: UserRole) -> Callable[[UserContext], UserContext]:
    """Dependency factory enforcing a single specific user role."""
    def role_checker(current_user: UserContext = Depends(get_current_active_user)) -> UserContext:
        if current_user.role != required_role and current_user.role != UserRole.ADMIN:
            raise AuthorizationError(f"Access forbidden: Requires role '{required_role.value}'")
        return current_user
    return role_checker


def require_any_role(allowed_roles: List[UserRole]) -> Callable[[UserContext], UserContext]:
    """Dependency factory enforcing membership in any of the specified roles."""
    def role_checker(current_user: UserContext = Depends(get_current_active_user)) -> UserContext:
        if current_user.role not in allowed_roles and current_user.role != UserRole.ADMIN:
            raise AuthorizationError(
                f"Access forbidden: Requires one of roles {[r.value for r in allowed_roles]}"
            )
        return current_user
    return role_checker


# ==============================================================================
# Repositories Dependencies
# ==============================================================================

def get_user_repo(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)


def get_shipment_repo(db: Session = Depends(get_db)) -> ShipmentRepository:
    return ShipmentRepository(db)


def get_vehicle_repo(db: Session = Depends(get_db)) -> VehicleRepository:
    return VehicleRepository(db)


def get_incident_repo(db: Session = Depends(get_db)) -> IncidentRepository:
    return IncidentRepository(db)


def get_road_repo(db: Session = Depends(get_db)) -> RoadRepository:
    return RoadRepository(db)


def get_route_repo(db: Session = Depends(get_db)) -> RouteRepository:
    return RouteRepository(db)


def get_alert_repo(db: Session = Depends(get_db)) -> AlertRepository:
    return AlertRepository(db)


def get_audit_repo(db: Session = Depends(get_db)) -> AuditRepository:
    return AuditRepository(db)


def get_district_repo(db: Session = Depends(get_db)) -> DistrictRepository:
    return DistrictRepository(db)


def get_prediction_repo(db: Session = Depends(get_db)) -> PredictionRepository:
    return PredictionRepository(db)


# ==============================================================================
# External Adapters Dependencies
# ==============================================================================

def get_routing_provider() -> RoutingProviderProtocol:
    if settings.ROUTING_PROVIDER == "osrm" and not settings.MOCK_DATA_MODE:
        return OSRMRoutingAdapter(base_url=settings.ROUTING_PROVIDER_URL)
    return MockRoutingAdapter()


def get_weather_provider() -> WeatherProviderProtocol:
    if settings.WEATHER_PROVIDER == "openmeteo" and not settings.MOCK_DATA_MODE:
        return OpenMeteoWeatherAdapter(base_url=settings.WEATHER_PROVIDER_URL)
    return MockWeatherAdapter()


def get_ai_adapter() -> AIIntegrationAdapter:
    return AIIntegrationAdapter()


# ==============================================================================
# Business Services Dependencies
# ==============================================================================

def get_ai_service(
    db: Session = Depends(get_db),
    prediction_repo: PredictionRepository = Depends(get_prediction_repo),
) -> AIService:
    return AIService(db, prediction_repo)

def get_auth_service(
    db: Session = Depends(get_db),
    user_repo: UserRepository = Depends(get_user_repo),
) -> AuthService:
    return AuthService(db, user_repo)


def get_shipment_service(
    db: Session = Depends(get_db),
    shipment_repo: ShipmentRepository = Depends(get_shipment_repo),
    vehicle_repo: VehicleRepository = Depends(get_vehicle_repo),
) -> ShipmentService:
    return ShipmentService(db, shipment_repo, vehicle_repo)


def get_vehicle_service(
    db: Session = Depends(get_db),
    vehicle_repo: VehicleRepository = Depends(get_vehicle_repo),
) -> VehicleService:
    return VehicleService(db, vehicle_repo)


def get_alert_service(
    db: Session = Depends(get_db),
    alert_repo: AlertRepository = Depends(get_alert_repo),
) -> AlertService:
    return AlertService(db, alert_repo)


def get_incident_service(
    db: Session = Depends(get_db),
    incident_repo: IncidentRepository = Depends(get_incident_repo),
    road_repo: RoadRepository = Depends(get_road_repo),
    alert_service: AlertService = Depends(get_alert_service),
) -> IncidentService:
    return IncidentService(db, incident_repo, road_repo, alert_service)


def get_gis_service(
    db: Session = Depends(get_db),
    road_repo: RoadRepository = Depends(get_road_repo),
    district_repo: DistrictRepository = Depends(get_district_repo),
    incident_repo: IncidentRepository = Depends(get_incident_repo),
) -> GISService:
    return GISService(db, road_repo, district_repo, incident_repo)


def get_route_orchestrator(
    db: Session = Depends(get_db),
    routing_provider: RoutingProviderProtocol = Depends(get_routing_provider),
    ai_adapter: AIIntegrationAdapter = Depends(get_ai_adapter),
    road_repo: RoadRepository = Depends(get_road_repo),
    incident_repo: IncidentRepository = Depends(get_incident_repo),
) -> RouteOrchestrator:
    return RouteOrchestrator(db, routing_provider, ai_adapter, road_repo, incident_repo)


def get_audit_service(
    db: Session = Depends(get_db),
    audit_repo: AuditRepository = Depends(get_audit_repo),
) -> AuditService:
    return AuditService(db, audit_repo)


def get_health_service(db: Session = Depends(get_db)) -> HealthService:
    return HealthService(db)
