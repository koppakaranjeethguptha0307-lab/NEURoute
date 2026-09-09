"""Adapters package export."""

from app.adapters.routing import (
    RouteGeometryResult,
    RoutingProviderProtocol,
    MockRoutingAdapter,
    OSRMRoutingAdapter,
)
from app.adapters.weather import (
    WeatherObservationResult,
    WeatherProviderProtocol,
    MockWeatherAdapter,
    OpenMeteoWeatherAdapter,
)
from app.adapters.ai import (
    ClassifiedIncidentResult,
    SegmentRiskResult,
    EstimatedDelayResult,
    IncidentClassifierProtocol,
    RiskPredictorProtocol,
    DelayEstimatorProtocol,
    AIIntegrationAdapter,
    MockAIAdapter,
)

__all__ = [
    "RouteGeometryResult",
    "RoutingProviderProtocol",
    "MockRoutingAdapter",
    "OSRMRoutingAdapter",
    "WeatherObservationResult",
    "WeatherProviderProtocol",
    "MockWeatherAdapter",
    "OpenMeteoWeatherAdapter",
    "ClassifiedIncidentResult",
    "SegmentRiskResult",
    "EstimatedDelayResult",
    "IncidentClassifierProtocol",
    "RiskPredictorProtocol",
    "DelayEstimatorProtocol",
    "AIIntegrationAdapter",
    "MockAIAdapter",
]
