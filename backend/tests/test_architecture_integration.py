"""
Critical architecture and integration tests.
Verifies the multi-service and repository integration flow without external dependencies.
"""

import pytest
from app.adapters.ai.ai_adapter import AIIntegrationAdapter
from app.adapters.routing.mock_routing import MockRoutingAdapter
from app.adapters.routing.osrm_adapter import OSRMRoutingAdapter
from app.adapters.weather.mock_weather import MockWeatherAdapter
from app.adapters.weather.openmeteo_adapter import OpenMeteoWeatherAdapter
from app.core.exceptions import (
    BusinessRuleError,
    ConflictError,
    ResourceNotFoundError,
    ValidationError,
)
from app.models.incident import Incident
from app.models.road import RoadSegment
from app.repositories.alert_repository import AlertRepository
from app.repositories.incident_repository import IncidentRepository
from app.repositories.road_repository import RoadRepository
from app.schemas.enums import (
    AlertSeverity,
    CargoPriority,
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
    RoadStatus,
    RouteOptimizationCriterion,
)
from app.schemas.incident import IncidentCreate, IncidentStatusTransition
from app.schemas.route import Coordinate, RoutePlanRequest
from app.services.alert_service import AlertService
from app.services.incident_service import IncidentService
from app.services.route_orchestrator import RouteOrchestrator


def test_critical_incident_road_alert_integration(db_session, sample_road_segment):
    """
    CRITICAL INTEGRATION TEST 1:
    Incident Service -> Road Repository -> Alert Service
    """
    alert_repo = AlertRepository(db_session)
    alert_service = AlertService(db_session, alert_repo=alert_repo)
    road_repo = RoadRepository(db_session)
    incident_repo = IncidentRepository(db_session)
    incident_service = IncidentService(
        db=db_session,
        incident_repo=incident_repo,
        road_repo=road_repo,
        alert_service=alert_service,
    )

    # Initial state
    assert sample_road_segment.current_status == RoadStatus.OPEN.value

    # 1. Report critical flood incident
    incident_data = IncidentCreate(
        title="NH-06 Bridge Submerged",
        category=IncidentCategory.FLOOD,
        severity=IncidentSeverity.CRITICAL,
        description="River waters overflowed approach bridge span.",
        latitude=25.2000,
        longitude=92.1500,
        road_segment_id=sample_road_segment.id,
        blocked_lanes=2,
        passable_by_heavy_vehicles=False,
    )

    created_incident = incident_service.report_incident(incident_data)
    assert created_incident.id is not None
    assert created_incident.status == IncidentStatus.REPORTED.value

    # Verify road status was transitioned to BLOCKED by road impact logic
    updated_road = road_repo.get_by_id(sample_road_segment.id)
    assert updated_road.current_status == RoadStatus.BLOCKED.value
    assert updated_road.risk_score >= 0.90

    # Verify operational alert was created and linked to the incident
    alerts = alert_service.list_alerts(severity=AlertSeverity.CRITICAL)
    assert len(alerts) >= 1
    target_alert = next((a for a in alerts if a.entity_id == created_incident.id), None)
    assert target_alert is not None
    assert target_alert.severity == AlertSeverity.CRITICAL.value
    assert target_alert.category == "ROAD_DISRUPTION"

    # 2. Transition incident to RESOLVED
    incident_service.transition_status(
        created_incident.id,
        IncidentStatusTransition(status=IncidentStatus.RESOLVED, resolution_notes="Water receded, bridge structure inspected and safe.")
    )

    # Road status must return to OPEN
    road_after_resolve = road_repo.get_by_id(sample_road_segment.id)
    assert road_after_resolve.current_status == RoadStatus.OPEN.value
    assert road_after_resolve.risk_score <= 0.10


@pytest.mark.asyncio
async def test_critical_route_orchestrator_routing_ai_integration(db_session, sample_road_segment):
    """
    CRITICAL INTEGRATION TEST 2:
    Route Orchestrator -> Routing Provider Mock -> AI Adapter Mock -> Normalized route result
    """
    routing_mock = MockRoutingAdapter()
    ai_mock = AIIntegrationAdapter()
    road_repo = RoadRepository(db_session)
    incident_repo = IncidentRepository(db_session)

    orchestrator = RouteOrchestrator(
        db=db_session,
        routing_provider=routing_mock,
        ai_adapter=ai_mock,
        road_repo=road_repo,
        incident_repo=incident_repo,
    )

    # Plan route with High Priority cargo (Vaccine / Relief)
    request = RoutePlanRequest(
        origin=Coordinate(lat=26.1445, lng=91.7362),       # Guwahati Depot
        destination=Coordinate(lat=24.8333, lng=92.7789),  # Silchar Forward Depot
        cargo_priority=CargoPriority.CRITICAL,
        avoid_blocked=True,
    )

    response = await orchestrator.plan_route(request)

    assert response.request_id is not None
    assert response.cargo_priority == CargoPriority.CRITICAL
    assert response.origin.lat == 26.1445
    assert response.destination.lat == 24.8333

    # Recommended route must be Safest or Priority route
    rec = response.recommended_route
    assert rec.is_recommended is True
    assert rec.criterion in [RouteOptimizationCriterion.PRIORITY, RouteOptimizationCriterion.SAFEST]
    assert rec.distance_km > 0
    assert rec.estimated_duration_hours > 0
    assert len(rec.geometry_coordinates) >= 2
    assert len(rec.ai_explanation) >= 1

    # Alternatives must contain Fastest route
    alt_criteria = [alt.criterion for alt in response.alternative_routes]
    assert RouteOptimizationCriterion.FASTEST in alt_criteria


@pytest.mark.asyncio
async def test_osrm_adapter_fallback_on_network_failure():
    """Verify OSRM adapter gracefully falls back to deterministic mock on invalid URL or failure."""
    failing_osrm = OSRMRoutingAdapter(base_url="http://invalid-unreachable-osrm-host.local", timeout=0.5)
    result = await failing_osrm.calculate_route(
        origin_lat=26.1445,
        origin_lng=91.7362,
        dest_lat=25.5788,
        dest_lng=91.8933,
    )

    assert result is not None
    assert result.distance_km > 0
    assert result.is_mock is True  # Fell back cleanly


@pytest.mark.asyncio
async def test_openmeteo_adapter_fallback_on_network_failure():
    """Verify Open-Meteo weather adapter gracefully falls back to deterministic mock on network failure."""
    failing_weather = OpenMeteoWeatherAdapter(base_url="http://invalid-unreachable-weather-host.local", timeout=0.5)
    result = await failing_weather.get_current_weather(25.5788, 91.8933, "Shillong Station")

    assert result is not None
    assert result.temperature_c > 0
    assert result.is_mock is True  # Fell back cleanly
