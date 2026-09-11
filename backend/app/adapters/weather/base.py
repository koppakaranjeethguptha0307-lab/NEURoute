"""Weather provider protocol/interface definition."""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Protocol, runtime_checkable
from pydantic import BaseModel, Field


class WeatherSource(str, Enum):
    LIVE_API = "LIVE_API"
    SIMULATED = "SIMULATED"
    FALLBACK = "FALLBACK"
    UNAVAILABLE = "UNAVAILABLE"


class WeatherObservationResult(BaseModel):
    location_name: str
    latitude: float
    longitude: float
    temperature_c: float
    rainfall_mm: float
    wind_speed_kmh: float
    visibility_km: float
    condition: str
    is_mock: bool = False
    source: WeatherSource = WeatherSource.SIMULATED
    humidity_percent: float = 80.0
    precipitation_probability: float = 0.0
    weather_alerts: List[str] = Field(default_factory=list)
    observed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


@runtime_checkable
class WeatherProviderProtocol(Protocol):
    """Protocol defining methods for external/mock weather observation services."""

    async def get_current_weather(self, lat: float, lng: float, location_name: Optional[str] = None) -> WeatherObservationResult:
        """Fetch current weather metrics for a location."""
        ...
