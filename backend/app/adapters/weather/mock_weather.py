"""
Deterministic regional weather adapter for North Eastern Region.
Provides deterministic software simulation of weather metrics.
Explicitly identifies data source as SIMULATED.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional
from app.adapters.weather.base import WeatherObservationResult, WeatherProviderProtocol, WeatherSource


class MockWeatherAdapter(WeatherProviderProtocol):
    """Deterministic software weather provider tailored for NER geography."""

    REGIONAL_WEATHER_PROFILES: Dict[str, Dict[str, float | str]] = {
        "Shillong": {"temp": 18.5, "rainfall": 25.4, "wind": 14.0, "visibility": 6.5, "humidity": 92.0, "condition": "MONSOON_RAIN"},
        "Guwahati": {"temp": 28.0, "rainfall": 5.2, "wind": 8.0, "visibility": 9.0, "humidity": 78.0, "condition": "OVERCAST"},
        "Sonapur": {"temp": 23.0, "rainfall": 92.5, "wind": 44.0, "visibility": 0.28, "humidity": 98.0, "condition": "TORRENTIAL_RAIN"},
        "Silchar": {"temp": 26.5, "rainfall": 18.0, "wind": 10.5, "visibility": 7.0, "humidity": 85.0, "condition": "HEAVY_RAIN"},
        "Imphal": {"temp": 22.0, "rainfall": 8.5, "wind": 9.0, "visibility": 8.5, "humidity": 80.0, "condition": "LIGHT_RAIN"},
        "Kohima": {"temp": 17.0, "rainfall": 12.0, "wind": 11.0, "visibility": 6.0, "humidity": 88.0, "condition": "FOGGY_RAIN"},
        "Itanagar": {"temp": 24.0, "rainfall": 15.0, "wind": 7.5, "visibility": 7.5, "humidity": 82.0, "condition": "SCATTERED_SHOWERS"},
        "Aizawl": {"temp": 20.0, "rainfall": 14.5, "wind": 12.0, "visibility": 7.0, "humidity": 86.0, "condition": "DRIZZLE"},
        "Agartala": {"temp": 29.0, "rainfall": 4.0, "wind": 6.0, "visibility": 9.5, "humidity": 74.0, "condition": "CLOUDY"},
    }

    def __init__(self) -> None:
        self._custom_overrides: Dict[str, Dict[str, float | str]] = {}

    def set_override(self, location_key: str, data: Dict[str, float | str]) -> None:
        """Dynamically override simulated weather for scenario demonstrations."""
        self._custom_overrides[location_key.lower()] = data

    def reset_overrides(self) -> None:
        self._custom_overrides.clear()

    async def get_current_weather(self, lat: float, lng: float, location_name: Optional[str] = None) -> WeatherObservationResult:
        name = location_name or f"NER Location ({lat:.2f}, {lng:.2f})"
        
        # Check custom overrides first
        profile = None
        for key, override_data in self._custom_overrides.items():
            if (location_name and key in location_name.lower()) or key in name.lower():
                profile = override_data
                break

        if not profile:
            # Match closest profile if available
            profile = self.REGIONAL_WEATHER_PROFILES.get("Guwahati", {
                "temp": 25.0, "rainfall": 8.0, "wind": 10.0, "visibility": 8.0, "humidity": 80.0, "condition": "OVERCAST"
            })
            for city, data in self.REGIONAL_WEATHER_PROFILES.items():
                if location_name and city.lower() in location_name.lower():
                    profile = data
                    name = city
                    break

        rainfall = float(profile["rainfall"])
        alerts: List[str] = []
        if rainfall >= 80.0:
            alerts.append(f"CRITICAL RED ALERT: Torrential precipitation ({rainfall:.1f} mm) — High landslide risk")
        elif rainfall >= 30.0:
            alerts.append(f"AMBER ADVISORY: Heavy rainfall ({rainfall:.1f} mm) — Potential waterlogging")

        return WeatherObservationResult(
            location_name=name,
            latitude=lat,
            longitude=lng,
            temperature_c=float(profile["temp"]),
            rainfall_mm=rainfall,
            wind_speed_kmh=float(profile["wind"]),
            visibility_km=float(profile["visibility"]),
            condition=str(profile["condition"]),
            is_mock=True,
            source=WeatherSource.SIMULATED,
            humidity_percent=float(profile.get("humidity", 80.0)),
            precipitation_probability=min(100.0, rainfall * 1.5),
            weather_alerts=alerts,
            observed_at=datetime.now(timezone.utc),
        )
