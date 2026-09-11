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
    WeatherSource,
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
from app.adapters.gps import (
    GPSProviderProtocol,
    GPSReading,
    GPSSource,
    SimulatorGPSProvider,
    LiveApiGPSProvider,
)
from app.adapters.cold_chain import (
    ColdChainProviderProtocol,
    ColdChainReading,
    ColdChainSource,
    ColdChainStatus,
    SimulatorColdChainProvider,
    LiveApiColdChainProvider,
)
from app.adapters.government import (
    GovernmentAdvisory,
    GovernmentIntegrationProtocol,
    GovernmentSource,
    SimulatorGovernmentAdapter,
    LiveGovernmentAdapter,
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
    "WeatherSource",
    "ClassifiedIncidentResult",
    "SegmentRiskResult",
    "EstimatedDelayResult",
    "IncidentClassifierProtocol",
    "RiskPredictorProtocol",
    "DelayEstimatorProtocol",
    "AIIntegrationAdapter",
    "MockAIAdapter",
    "GPSProviderProtocol",
    "GPSReading",
    "GPSSource",
    "SimulatorGPSProvider",
    "LiveApiGPSProvider",
    "ColdChainProviderProtocol",
    "ColdChainReading",
    "ColdChainSource",
    "ColdChainStatus",
    "SimulatorColdChainProvider",
    "LiveApiColdChainProvider",
    "GovernmentAdvisory",
    "GovernmentIntegrationProtocol",
    "GovernmentSource",
    "SimulatorGovernmentAdapter",
    "LiveGovernmentAdapter",
]
