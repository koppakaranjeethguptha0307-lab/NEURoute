"""
Open-Meteo HTTP Weather Adapter with automatic fallback.
Explicitly identifies data source as LIVE_API when successful, or FALLBACK when using mock.
"""

from datetime import datetime, timezone
from typing import List, Optional
import httpx
from app.adapters.weather.base import WeatherObservationResult, WeatherProviderProtocol, WeatherSource
from app.adapters.weather.mock_weather import MockWeatherAdapter
from app.core.config import settings
from app.core.logging import logger


class OpenMeteoWeatherAdapter(WeatherProviderProtocol):
    """Open-Meteo weather integration adapter."""

    def __init__(self, base_url: Optional[str] = None, timeout: float = 5.0) -> None:
        self.base_url = (base_url or settings.WEATHER_PROVIDER_URL).rstrip("/")
        self.timeout = timeout
        self.fallback = MockWeatherAdapter()

    async def get_current_weather(self, lat: float, lng: float, location_name: Optional[str] = None) -> WeatherObservationResult:
        url = f"{self.base_url}/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m"
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    current = data.get("current", {})
                    temp = current.get("temperature_2m", 25.0)
                    rain = current.get("rain", current.get("precipitation", 0.0))
                    wind = current.get("wind_speed_10m", 5.0)
                    humidity = current.get("relative_humidity_2m", 75.0)
                    
                    condition = "CLEAR"
                    alerts: List[str] = []
                    if rain > 50.0:
                        condition = "TORRENTIAL_RAIN"
                        alerts.append(f"EXTREME WEATHER: Severe precipitation ({rain:.1f} mm)")
                    elif rain > 15.0:
                        condition = "HEAVY_RAIN"
                        alerts.append(f"HEAVY RAIN ADVISORY: {rain:.1f} mm recorded")
                    elif rain > 2.0:
                        condition = "RAIN"
                    elif rain > 0.1:
                        condition = "LIGHT_RAIN"

                    visibility = 8.0 if rain < 5.0 else (3.5 if rain < 20.0 else 0.8)

                    return WeatherObservationResult(
                        location_name=location_name or f"Geo ({lat:.2f}, {lng:.2f})",
                        latitude=lat,
                        longitude=lng,
                        temperature_c=temp,
                        rainfall_mm=rain,
                        wind_speed_kmh=wind,
                        visibility_km=visibility,
                        condition=condition,
                        is_mock=False,
                        source=WeatherSource.LIVE_API,
                        humidity_percent=float(humidity),
                        precipitation_probability=min(100.0, rain * 2.0),
                        weather_alerts=alerts,
                        observed_at=datetime.now(timezone.utc),
                    )
        except Exception as e:
            logger.warning(
                f"OpenMeteo weather request failed: {str(e)}. Falling back to deterministic NER weather.",
                extra={"service": "weather_adapter", "status": "FALLBACK"}
            )

        fallback_result = await self.fallback.get_current_weather(lat, lng, location_name)
        fallback_result.source = WeatherSource.FALLBACK
        return fallback_result
