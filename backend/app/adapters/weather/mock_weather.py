"""
Deterministic regional weather adapter for North Eastern Region.
"""

from typing import Optional
from app.adapters.weather.base import WeatherObservationResult, WeatherProviderProtocol


class MockWeatherAdapter(WeatherProviderProtocol):
    """Deterministic weather provider tailored for NER geography."""

    REGIONAL_WEATHER_PROFILES = {
        "Shillong": {"temp": 18.5, "rainfall": 25.4, "wind": 14.0, "visibility": 6.5, "condition": "MONSOON_RAIN"},
        "Guwahati": {"temp": 28.0, "rainfall": 5.2, "wind": 8.0, "visibility": 9.0, "condition": "OVERCAST"},
        "Silchar": {"temp": 26.5, "rainfall": 18.0, "wind": 10.5, "visibility": 7.0, "condition": "HEAVY_RAIN"},
        "Imphal": {"temp": 22.0, "rainfall": 8.5, "wind": 9.0, "visibility": 8.5, "condition": "LIGHT_RAIN"},
        "Kohima": {"temp": 17.0, "rainfall": 12.0, "wind": 11.0, "visibility": 6.0, "condition": "FOGGY_RAIN"},
        "Itanagar": {"temp": 24.0, "rainfall": 15.0, "wind": 7.5, "visibility": 7.5, "condition": "SCATTERED_SHOWERS"},
        "Aizawl": {"temp": 20.0, "rainfall": 14.5, "wind": 12.0, "visibility": 7.0, "condition": "DRIZZLE"},
        "Agartala": {"temp": 29.0, "rainfall": 4.0, "wind": 6.0, "visibility": 9.5, "condition": "CLOUDY"},
    }

    async def get_current_weather(self, lat: float, lng: float, location_name: Optional[str] = None) -> WeatherObservationResult:
        name = location_name or "NER Station"
        
        # Match closest profile if available
        profile = self.REGIONAL_WEATHER_PROFILES.get("Guwahati", {
            "temp": 25.0, "rainfall": 8.0, "wind": 10.0, "visibility": 8.0, "condition": "OVERCAST"
        })
        for city, data in self.REGIONAL_WEATHER_PROFILES.items():
            if location_name and city.lower() in location_name.lower():
                profile = data
                name = city
                break

        return WeatherObservationResult(
            location_name=name,
            latitude=lat,
            longitude=lng,
            temperature_c=profile["temp"],
            rainfall_mm=profile["rainfall"],
            wind_speed_kmh=profile["wind"],
            visibility_km=profile["visibility"],
            condition=profile["condition"],
            is_mock=True,
        )
