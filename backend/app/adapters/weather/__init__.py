"""Weather adapters package."""

from app.adapters.weather.base import WeatherObservationResult, WeatherProviderProtocol, WeatherSource
from app.adapters.weather.mock_weather import MockWeatherAdapter
from app.adapters.weather.openmeteo_adapter import OpenMeteoWeatherAdapter

__all__ = [
    "WeatherObservationResult",
    "WeatherProviderProtocol",
    "WeatherSource",
    "MockWeatherAdapter",
    "OpenMeteoWeatherAdapter",
]
