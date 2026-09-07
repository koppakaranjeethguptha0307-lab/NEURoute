"""Vehicle fleet and telemetry schemas."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.enums import VehicleStatus


class VehicleBase(BaseModel):
    registration_number: str = Field(..., max_length=50)
    vehicle_type: str = Field(default="Heavy Truck", description="Vehicle classification (e.g. 4x4 Mountain Truck, Light Commercial, Tanker)")
    capacity_kg: float = Field(default=5000.0, ge=0.0)
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    assigned_hub_id: Optional[int] = None
    fuel_level_percent: float = Field(default=100.0, ge=0.0, le=100.0)


class VehicleCreate(VehicleBase):
    current_lat: Optional[float] = Field(None, ge=-90.0, le=90.0)
    current_lng: Optional[float] = Field(None, ge=-180.0, le=180.0)


class VehicleUpdate(BaseModel):
    vehicle_type: Optional[str] = None
    capacity_kg: Optional[float] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    status: Optional[VehicleStatus] = None
    assigned_hub_id: Optional[int] = None
    fuel_level_percent: Optional[float] = Field(None, ge=0.0, le=100.0)


class VehicleLocationUpdate(BaseModel):
    lat: float = Field(..., ge=-90.0, le=90.0)
    lng: float = Field(..., ge=-180.0, le=180.0)
    speed_kmh: Optional[float] = Field(None, ge=0.0)
    heading_deg: Optional[float] = Field(None, ge=0.0, le=360.0)
    fuel_level_percent: Optional[float] = Field(None, ge=0.0, le=100.0)


class VehicleResponse(VehicleBase):
    id: int
    status: VehicleStatus
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    speed_kmh: Optional[float] = 0.0
    heading_deg: Optional[float] = 0.0
    last_telemetry_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
