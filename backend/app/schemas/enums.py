"""
Canonical domain enums for the NEURoute platform.
Shared across models, schemas, business logic, and API contracts.
"""

from enum import Enum


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    LOGISTICS_OPERATOR = "LOGISTICS_OPERATOR"
    GOVERNMENT_AUTHORITY = "GOVERNMENT_AUTHORITY"
    EMERGENCY_RESPONSE = "EMERGENCY_RESPONSE"
    GENERAL_VIEWER = "GENERAL_VIEWER"


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
    ACCIDENT = "ACCIDENT"
    CONSTRUCTION = "CONSTRUCTION"


class ShipmentStatus(str, Enum):
    CREATED = "CREATED"
    ASSIGNED = "ASSIGNED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class CargoPriority(str, Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class VehicleStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    ASSIGNED = "ASSIGNED"
    IN_TRANSIT = "IN_TRANSIT"
    MAINTENANCE = "MAINTENANCE"
    OFFLINE = "OFFLINE"


class AlertSeverity(str, Enum):
    INFORMATIONAL = "INFORMATIONAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class RouteOptimizationCriterion(str, Enum):
    SAFEST = "SAFEST"
    FASTEST = "FASTEST"
    PRIORITY = "PRIORITY"
