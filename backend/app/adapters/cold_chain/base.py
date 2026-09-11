"""
NEURoute — Software-Based Cold-Chain Telemetry Monitoring & Excursion-Risk Management.
Designed to ingest IoT/API telemetry when available, while providing realistic software simulation.
DOES NOT require physical hardware temperature sensors.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Protocol, runtime_checkable
from pydantic import BaseModel, Field


class ColdChainStatus(str, Enum):
    NORMAL = "NORMAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class ColdChainSource(str, Enum):
    LIVE_API = "LIVE_API"
    SIMULATOR = "SIMULATED_TELEMETRY"
    NOT_CONFIGURED = "NOT_CONFIGURED"


class ColdChainReading(BaseModel):
    shipment_id: int
    vehicle_id: Optional[int] = None
    temperature_c: float
    humidity_percent: float = Field(default=65.0, ge=0.0, le=100.0)
    threshold_min_c: float = 2.0
    threshold_max_c: float = 8.0
    status: ColdChainStatus = ColdChainStatus.NORMAL
    source: ColdChainSource = ColdChainSource.SIMULATOR
    ambient_temp_c: float = 28.0
    location_lat: Optional[float] = None
    location_lng: Optional[float] = None
    notes: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@runtime_checkable
class ColdChainProviderProtocol(Protocol):
    """Protocol governing software-based cold-chain telemetry."""

    async def get_latest_reading(self, shipment_id: int) -> ColdChainReading:
        """Fetch current thermal metrics for a consignment."""
        ...

    async def get_time_series(self, shipment_id: int) -> List[ColdChainReading]:
        """Fetch historical time-series temperature readings for a consignment."""
        ...

    async def simulate_temperature_step(self, shipment_id: int, target_temp_c: Optional[float] = None) -> ColdChainReading:
        """Advance thermal excursion simulation for demonstration."""
        ...
