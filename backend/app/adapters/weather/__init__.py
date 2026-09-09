"""Weather adapters package."""

from app.adapters.weather.base import WeatherObservationResult, WeatherProviderProtocol
from app.adapters.weather.mock_weather import MockWeatherAdapter
from app.adapters.weather.openmeteo_adapter import OpenMeteoWeatherAdapter

__all__ = [
    "WeatherObservationResult",
    "WeatherProviderProtocol",
    "MockWeatherAdapter",
    "OpenMeteoWeatherAdapter",
]
