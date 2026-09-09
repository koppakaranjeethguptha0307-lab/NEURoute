"""Road, District and GeoJSON schemas."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.enums import RoadStatus


class RoadSegmentBase(BaseModel):
    segment_code: str = Field(..., description="Unique segment code (e.g. NH-06-MEGH-01)")
    name: str = Field(..., description="Segment name (e.g. Guwahati - Jorabat - Shillong Corridor)")
    highway_number: str = Field(..., description="Highway identifier (e.g. NH-06, NH-27, NH-102)")
    district_id: Optional[int] = None
    start_lat: float = Field(..., ge=-90.0, le=90.0)
    start_lng: float = Field(..., ge=-180.0, le=180.0)
    end_lat: float = Field(..., ge=-90.0, le=90.0)
    end_lng: float = Field(..., ge=-180.0, le=180.0)
    length_km: float = Field(default=0.0, ge=0.0)
    elevation_gain_m: float = Field(default=0.0)
    is_critical_lifeline: bool = True
    speed_limit_kmh: float = Field(default=40.0, ge=5.0)


class RoadSegmentCreate(RoadSegmentBase):
    coordinates_json: Optional[List[List[float]]] = None


class RoadSegmentResponse(RoadSegmentBase):
    id: int
    current_status: RoadStatus
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0)
    active_incidents_count: int = 0
    coordinates: List[List[float]] = []

    model_config = ConfigDict(from_attributes=True)


class DistrictResponse(BaseModel):
    id: int
    name: str
    state: str
    headquarters: Optional[str] = None
    accessibility_score: float = Field(default=1.0, ge=0.0, le=1.0)
    total_road_km: float = 0.0
    blocked_road_km: float = 0.0
    active_incidents_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class GeoJSONGeometry(BaseModel):
    type: str = "LineString"
    coordinates: Any


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: Optional[Any] = None
    geometry: GeoJSONGeometry
    properties: Dict[str, Any]


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]


class DistrictAccessibilityScore(BaseModel):
    district_id: int
    district_name: str
    state: str
    accessibility_score: float
    status: str
    blocked_segments: int
    open_segments: int
    isolated_hubs: int
