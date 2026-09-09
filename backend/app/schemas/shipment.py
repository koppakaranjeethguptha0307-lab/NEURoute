"""Shipment schemas and state transitions."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.enums import CargoPriority, ShipmentStatus


class ShipmentBase(BaseModel):
    tracking_number: str = Field(..., description="Unique shipment tracking identifier")
    title: str = Field(..., max_length=200)
    cargo_type: str = Field(..., description="Cargo category (e.g. Medical Supplies, Rations, Fuel, General)")
    cargo_priority: CargoPriority = CargoPriority.NORMAL
    weight_kg: float = Field(default=0.0, ge=0.0)
    origin_hub_id: Optional[int] = None
    origin_address: str
    origin_lat: float = Field(..., ge=-90.0, le=90.0)
    origin_lng: float = Field(..., ge=-180.0, le=180.0)
    destination_hub_id: Optional[int] = None
    destination_address: str
    destination_lat: float = Field(..., ge=-90.0, le=90.0)
    destination_lng: float = Field(..., ge=-180.0, le=180.0)
    assigned_vehicle_id: Optional[int] = None
    notes: Optional[str] = None


class ShipmentCreate(ShipmentBase):
    pass


class ShipmentUpdate(BaseModel):
    title: Optional[str] = None
    cargo_type: Optional[str] = None
    cargo_priority: Optional[CargoPriority] = None
    weight_kg: Optional[float] = None
    origin_address: Optional[str] = None
    destination_address: Optional[str] = None
    assigned_vehicle_id: Optional[int] = None
    notes: Optional[str] = None


class ShipmentStatusTransition(BaseModel):
    status: ShipmentStatus
    reason: Optional[str] = None
    current_lat: Optional[float] = Field(None, ge=-90.0, le=90.0)
    current_lng: Optional[float] = Field(None, ge=-180.0, le=180.0)


class ShipmentResponse(ShipmentBase):
    id: int
    status: ShipmentStatus
    dispatched_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    estimated_delivery: Optional[datetime] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
