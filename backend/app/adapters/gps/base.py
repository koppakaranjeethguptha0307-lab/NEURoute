"""
NEURoute — Software-Only GPS Provider Protocol and Telemetry Models
Standardized software contract for vehicle tracking.
Supports both Live API feeds and GIS-constrained Software Simulators.
Every record explicitly defines its data source (LIVE | SIMULATED).
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Protocol, runtime_checkable
from pydantic import BaseModel, Field


class GPSSource(str, Enum):
    LIVE = "LIVE"
    SIMULATED = "SIMULATED"
    UNAVAILABLE = "UNAVAILABLE"


class TelemetryStatus(str, Enum):
    ACTIVE = "ACTIVE"
    IN_TRANSIT = "IN_TRANSIT"
    IDLE = "IDLE"
    OFFLINE = "OFFLINE"


class GPSReading(BaseModel):
    vehicle_id: int
    registration_number: str
    shipment_id: Optional[int] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    speed_kmh: float = Field(default=0.0, ge=0.0)
    heading_deg: float = Field(default=0.0, ge=0.0, le=360.0)
    fuel_level_percent: float = Field(default=100.0, ge=0.0, le=100.0)
    route_progress_pct: float = Field(default=0.0, ge=0.0, le=100.0)
    current_road_segment_id: Optional[str] = None
    current_road_name: Optional[str] = None
    estimated_eta_minutes: Optional[float] = None
    source: GPSSource = GPSSource.SIMULATED
    telemetry_status: TelemetryStatus = TelemetryStatus.IN_TRANSIT
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@runtime_checkable
class GPSProviderProtocol(Protocol):
    """Protocol governing all software GPS data sources."""

    async def get_vehicle_location(self, vehicle_id: int) -> GPSReading:
        """Fetch the latest telemetry reading for a given vehicle."""
        ...

    async def step_vehicle_route(self, vehicle_id: int, step_fraction: float = 0.05) -> GPSReading:
        """Advance vehicle along its assigned corridor route in software."""
        ...

    async def list_fleet_telemetry(self) -> List[GPSReading]:
        """Fetch telemetry for all active fleet units."""
        ...
