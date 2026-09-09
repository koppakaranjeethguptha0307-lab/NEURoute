"""Domain schemas package export."""

from app.schemas.enums import (
    UserRole,
    RoadStatus,
    IncidentStatus,
    IncidentSeverity,
    IncidentCategory,
    ShipmentStatus,
    CargoPriority,
    VehicleStatus,
    AlertSeverity,
    RouteOptimizationCriterion,
)
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    TokenPayload,
    UserContext,
)
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    RoleResponse,
)
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentStatusTransition,
    ShipmentResponse,
)
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleUpdate,
    VehicleLocationUpdate,
    VehicleResponse,
)
from app.schemas.incident import (
    IncidentCreate,
    IncidentUpdate,
    IncidentStatusTransition,
    IncidentResponse,
    FieldReportSync,
)
from app.schemas.road import (
    RoadSegmentCreate,
    RoadSegmentResponse,
    DistrictResponse,
    GeoJSONFeature,
    GeoJSONFeatureCollection,
    DistrictAccessibilityScore,
)
from app.schemas.route import (
    Coordinate,
    RoutePlanRequest,
    RouteOption,
    RoutePlanResponse,
    AlternateRouteRequest,
)
from app.schemas.ai import (
    IncidentClassificationRequest,
    IncidentClassificationResponse,
    RiskPredictionRequest,
    RiskPredictionResponse,
    DelayEstimationRequest,
    DelayEstimationResponse,
)
from app.schemas.alert import (
    AlertCreate,
    AlertResponse,
    AlertFilter,
)
from app.schemas.audit import (
    AuditLogCreate,
    AuditLogResponse,
)
from app.schemas.health import (
    ComponentHealth,
    HealthCheckResponse,
)

__all__ = [
    "UserRole",
    "RoadStatus",
    "IncidentStatus",
    "IncidentSeverity",
    "IncidentCategory",
    "ShipmentStatus",
    "CargoPriority",
    "VehicleStatus",
    "AlertSeverity",
    "RouteOptimizationCriterion",
    "LoginRequest",
    "TokenResponse",
    "TokenPayload",
    "UserContext",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "RoleResponse",
    "ShipmentCreate",
    "ShipmentUpdate",
    "ShipmentStatusTransition",
    "ShipmentResponse",
    "VehicleCreate",
    "VehicleUpdate",
    "VehicleLocationUpdate",
    "VehicleResponse",
    "IncidentCreate",
    "IncidentUpdate",
    "IncidentStatusTransition",
    "IncidentResponse",
    "FieldReportSync",
    "RoadSegmentCreate",
    "RoadSegmentResponse",
    "DistrictResponse",
    "GeoJSONFeature",
    "GeoJSONFeatureCollection",
    "DistrictAccessibilityScore",
    "Coordinate",
    "RoutePlanRequest",
    "RouteOption",
    "RoutePlanResponse",
    "AlternateRouteRequest",
    "IncidentClassificationRequest",
    "IncidentClassificationResponse",
    "RiskPredictionRequest",
    "RiskPredictionResponse",
    "DelayEstimationRequest",
    "DelayEstimationResponse",
    "AlertCreate",
    "AlertResponse",
    "AlertFilter",
    "AuditLogCreate",
    "AuditLogResponse",
    "ComponentHealth",
    "HealthCheckResponse",
]
