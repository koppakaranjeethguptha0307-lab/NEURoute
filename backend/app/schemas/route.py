"""Route planning, waypoint, and comparison schemas."""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.enums import CargoPriority, RouteOptimizationCriterion


class Coordinate(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)


class RoutePlanRequest(BaseModel):
    origin: Coordinate
    destination: Coordinate
    cargo_priority: CargoPriority = CargoPriority.NORMAL
    vehicle_type: Optional[str] = "Heavy Truck"
    avoid_blocked: bool = True
    max_alternatives: int = Field(default=3, ge=1, le=5)


class AlternateRouteRequest(BaseModel):
    current_lat: float = Field(..., ge=-90.0, le=90.0)
    current_lng: float = Field(..., ge=-180.0, le=180.0)
    destination_lat: float = Field(..., ge=-90.0, le=90.0)
    destination_lng: float = Field(..., ge=-180.0, le=180.0)
    blocked_segment_ids: List[int] = []
    cargo_priority: CargoPriority = CargoPriority.HIGH


class RouteSegmentDetail(BaseModel):
    segment_id: Optional[int] = None
    name: str
    highway_number: str
    length_km: float
    status: str
    risk_score: float
    hazard_description: Optional[str] = None


class RouteOption(BaseModel):
    criterion: RouteOptimizationCriterion
    title: str
    summary: str
    distance_km: float
    estimated_duration_hours: float
    composite_risk_score: float
    safety_score: float
    estimated_delay_hours: float
    is_recommended: bool
    ai_explanation: List[str] = []
    blocked_segments_count: int = 0
    risky_segments_count: int = 0
    segments: List[RouteSegmentDetail] = []
    geometry_coordinates: List[List[float]] = []


class RoutePlanResponse(BaseModel):
    request_id: str
    cargo_priority: CargoPriority
    origin: Coordinate
    destination: Coordinate
    recommended_route: RouteOption
    alternative_routes: List[RouteOption] = []
    planned_at: datetime
