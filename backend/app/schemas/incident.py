"""Incident and offline field report schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.enums import IncidentCategory, IncidentSeverity, IncidentStatus


class IncidentBase(BaseModel):
    title: str = Field(..., max_length=200)
    category: IncidentCategory
    severity: IncidentSeverity = IncidentSeverity.MEDIUM
    description: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    road_segment_id: Optional[int] = None
    district_id: Optional[int] = None
    blocked_lanes: int = Field(default=1, ge=0)
    passable_by_heavy_vehicles: bool = True
    estimated_clearance_hours: Optional[float] = Field(None, ge=0.0)


class IncidentCreate(IncidentBase):
    reported_by_user_id: Optional[int] = None


class IncidentUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[IncidentCategory] = None
    severity: Optional[IncidentSeverity] = None
    description: Optional[str] = None
    road_segment_id: Optional[int] = None
    blocked_lanes: Optional[int] = None
    passable_by_heavy_vehicles: Optional[bool] = None
    estimated_clearance_hours: Optional[float] = None


class IncidentStatusTransition(BaseModel):
    status: IncidentStatus
    resolution_notes: Optional[str] = None


class IncidentResponse(IncidentBase):
    id: int
    status: IncidentStatus
    reported_by_user_id: Optional[int] = None
    resolution_notes: Optional[str] = None
    reported_at: datetime
    resolved_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class FieldReportSync(BaseModel):
    client_report_uuid: str
    title: str
    category: IncidentCategory
    severity: IncidentSeverity
    description: Optional[str] = None
    latitude: float
    longitude: float
    captured_at: datetime
    photos: List[str] = []
