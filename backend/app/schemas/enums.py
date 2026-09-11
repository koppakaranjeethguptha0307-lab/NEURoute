"""
Canonical domain enums for the NEURoute platform.
Shared across models, schemas, business logic, and API contracts.
"""

from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    FIELD_OFFICER = "FIELD_OFFICER"
    DRIVER = "DRIVER"
    LOGISTICS_PLANNER = "LOGISTICS_PLANNER"


class RoadStatus(str, Enum):
    OPEN = "OPEN"
    RISKY = "RISKY"
    BLOCKED = "BLOCKED"
    UNKNOWN = "UNKNOWN"


class IncidentStatus(str, Enum):
    REPORTED = "REPORTED"
    INVESTIGATING = "INVESTIGATING"
    CONFIRMED = "CONFIRMED"
    ACTIVE = "ACTIVE"
    RESOLVED = "RESOLVED"


class IncidentSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IncidentCategory(str, Enum):
    LANDSLIDE = "LANDSLIDE"
    FLOOD = "FLOOD"
    ROAD_DAMAGE = "ROAD_DAMAGE"
    ROADBLOCK = "ROADBLOCK"
    BRIDGE_DAMAGE = "BRIDGE_DAMAGE"
    SNOWFALL_AVALANCHE = "SNOWFALL_AVALANCHE"
    HEAVY_RAIN = "HEAVY_RAIN"
    HEAVY_RAINFALL = "HEAVY_RAINFALL"
    ACCIDENT = "ACCIDENT"
    CONSTRUCTION = "CONSTRUCTION"


class ShipmentStatus(str, Enum):
    CREATED = "CREATED"
    ASSIGNED = "ASSIGNED"
    IN_TRANSIT = "IN_TRANSIT"
    DELAYED = "DELAYED"
    REROUTED = "REROUTED"
    EXCEPTION = "EXCEPTION"
    PENDING = "PENDING"
    PLANNED = "PLANNED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class CargoPriority(str, Enum):
    LOW = "LOW"
    STANDARD = "STANDARD"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    EMERGENCY = "EMERGENCY"


class VehicleStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    ASSIGNED = "ASSIGNED"
    IN_TRANSIT = "IN_TRANSIT"
    MAINTENANCE = "MAINTENANCE"
    OFFLINE = "OFFLINE"


class AlertSeverity(str, Enum):
    INFORMATIONAL = "INFORMATIONAL"
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class RouteOptimizationCriterion(str, Enum):
    SAFEST = "SAFEST"
    FASTEST = "FASTEST"
    PRIORITY = "PRIORITY"
