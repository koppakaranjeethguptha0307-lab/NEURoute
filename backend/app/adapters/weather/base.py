"""Weather provider protocol/interface definition."""

from typing import Optional, Protocol
from pydantic import BaseModel


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


class WeatherProviderProtocol(Protocol):
    """Protocol defining methods for external/mock weather observation services."""

    async def get_current_weather(self, lat: float, lng: float, location_name: Optional[str] = None) -> WeatherObservationResult:
        """Fetch current weather metrics for a location."""
        ...
