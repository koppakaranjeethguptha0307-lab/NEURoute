"""
Unit and integration tests for GIS features, GeoJSON generation, district accessibility scoring,
provider adapters, and multi-criteria route orchestration.
"""

import pytest
from app.adapters.ai.ai_adapter import AIIntegrationAdapter
from app.adapters.routing.mock_routing import MockRoutingAdapter
from app.adapters.weather.mock_weather import MockWeatherAdapter
from app.schemas.enums import CargoPriority, IncidentCategory, IncidentSeverity, RouteOptimizationCriterion
from app.schemas.route import Coordinate, RoutePlanRequest
from app.services.gis_service import GISService
from app.services.route_orchestrator import RouteOrchestrator


@pytest.mark.asyncio
async def test_mock_routing_adapter():
    """Verify deterministic routing provider produces valid NER geometry and metrics."""
    adapter = MockRoutingAdapter()
    result = await adapter.calculate_route(
        origin_lat=26.1445,  # Guwahati
        origin_lng=91.7362,
        dest_lat=25.5788,    # Shillong
        dest_lng=91.8933,
    )

    assert result.distance_km > 50.0
    assert result.duration_hours > 1.0
    assert len(result.coordinates) >= 2
    assert result.coordinates[0] == [26.1445, 91.7362]
    assert result.coordinates[-1] == [25.5788, 91.8933]
    assert result.is_mock is True


@pytest.mark.asyncio
async def test_mock_weather_adapter():
    """Verify regional weather observation profiles."""
    adapter = MockWeatherAdapter()
    shillong_weather = await adapter.get_current_weather(25.5788, 91.8933, "Shillong Station")

    assert shillong_weather.temperature_c == 18.5
    assert shillong_weather.rainfall_mm > 20.0
    assert shillong_weather.condition == "MONSOON_RAIN"
    assert shillong_weather.is_mock is True


@pytest.mark.asyncio
async def test_ai_adapter_delegation_to_injected_services():
    """Verify that AIIntegrationAdapter delegates prediction tasks to injected AI implementations."""
    from unittest.mock import AsyncMock
    from app.adapters.ai.base import (
        ClassifiedIncidentResult,
        DelayEstimatorProtocol,
        EstimatedDelayResult,
        IncidentClassifierProtocol,
        RiskPredictorProtocol,
        SegmentRiskResult,
    )

    # Create mock implementations fulfilling AI protocols
    mock_classifier = AsyncMock(spec=IncidentClassifierProtocol)
    mock_classifier.classify_incident_text.return_value = ClassifiedIncidentResult(
        category=IncidentCategory.LANDSLIDE,
        severity=IncidentSeverity.CRITICAL,
        confidence=0.92,
        extracted_keywords=["landslide", "sonapur"],
        is_fallback=False,
    )

    mock_risk_predictor = AsyncMock(spec=RiskPredictorProtocol)
    mock_risk_predictor.predict_segment_risk.return_value = SegmentRiskResult(
        segment_id=1,
        risk_score=0.88,
        risk_level="CRITICAL",
        contributing_factors={"weather": 0.9, "incidents": 0.85},
        recommendations=["Critical landslide risk on corridor"],
        is_fallback=False,
    )

    mock_delay_estimator = AsyncMock(spec=DelayEstimatorProtocol)
    mock_delay_estimator.estimate_delay.return_value = EstimatedDelayResult(
        nominal_duration_hours=2.5,
        estimated_delay_hours=1.2,
        total_expected_duration_hours=3.7,
        bottleneck_buffer_hours=0.5,
        is_fallback=False,
    )

    # Inject into adapter
    adapter_with_injected_ai = AIIntegrationAdapter(
        classifier=mock_classifier,
        risk_predictor=mock_risk_predictor,
        delay_estimator=mock_delay_estimator,
    )

    # Verify classification delegation
    classification = await adapter_with_injected_ai.classify_incident_text("Severe landslide near Sonapur")
    mock_classifier.classify_incident_text.assert_awaited_once_with("Severe landslide near Sonapur")
    assert classification.category == IncidentCategory.LANDSLIDE
    assert classification.severity == IncidentSeverity.CRITICAL
    assert classification.is_fallback is False

    # Verify risk predictor delegation
    risk_res = await adapter_with_injected_ai.predict_segment_risk(
        segment_id=1,
        rainfall_mm=35.0,
        active_incidents_count=2,
        historical_failure_rate=0.4,
        terrain_slope_deg=30.0,
    )
    mock_risk_predictor.predict_segment_risk.assert_awaited_once_with(1, 35.0, 2, 0.4, 30.0)
    assert risk_res.risk_score == 0.88
    assert risk_res.risk_level == "CRITICAL"
    assert risk_res.is_fallback is False

    # Verify delay estimator delegation
    delay_res = await adapter_with_injected_ai.estimate_delay(
        distance_km=100.0,
        base_speed_kmh=40.0,
        segment_risk_scores=[0.88],
        active_bottlenecks_count=1,
    )
    mock_delay_estimator.estimate_delay.assert_awaited_once_with(100.0, 40.0, [0.88], 1)
    assert delay_res.estimated_delay_hours == 1.2
    assert delay_res.total_expected_duration_hours == 3.7
    assert delay_res.is_fallback is False


@pytest.mark.asyncio
async def test_route_orchestrator_multi_criteria(db_session, sample_road_segment):
    """
    Verify route orchestration:
    Critical cargo recommends Priority/Safest route with explainable AI reasoning.
    """
    orchestrator = RouteOrchestrator(db_session)

    # 1. Plan route for CRITICAL medical cargo
    crit_request = RoutePlanRequest(
        origin=Coordinate(lat=26.1445, lng=91.7362),  # Guwahati
        destination=Coordinate(lat=25.5788, lng=91.8933),  # Shillong
        cargo_priority=CargoPriority.CRITICAL,
        avoid_blocked=True,
    )

    crit_plan = await orchestrator.plan_route(crit_request)
    assert crit_plan.recommended_route is not None
    assert crit_plan.recommended_route.criterion in [RouteOptimizationCriterion.PRIORITY, RouteOptimizationCriterion.SAFEST]
    assert len(crit_plan.recommended_route.ai_explanation) > 0
    assert len(crit_plan.alternative_routes) >= 2

    # 2. Plan route for NORMAL cargo
    norm_request = RoutePlanRequest(
        origin=Coordinate(lat=26.1445, lng=91.7362),
        destination=Coordinate(lat=25.5788, lng=91.8933),
        cargo_priority=CargoPriority.NORMAL,
    )

    norm_plan = await orchestrator.plan_route(norm_request)
    assert norm_plan.recommended_route.criterion == RouteOptimizationCriterion.FASTEST


def test_gis_service_geojson_and_accessibility(db_session, sample_road_segment):
    """Verify GeoJSON transformations and district accessibility calculation."""
    gis_service = GISService(db_session)

    # GeoJSON FeatureCollection
    geojson = gis_service.get_road_segments_geojson()
    assert geojson.type == "FeatureCollection"
    assert len(geojson.features) >= 1
    feature = geojson.features[0]
    assert feature.geometry.type == "LineString"
    assert feature.properties["segment_code"] == sample_road_segment.segment_code

    # District accessibility index
    access_res = gis_service.calculate_district_accessibility_index(sample_road_segment.district_id)
    assert access_res.accessibility_score == 1.0
    assert access_res.status == "ACCESSIBLE"

    # NER bounding box check
    assert gis_service.validate_ner_bounds(26.1445, 91.7362) is True
    assert gis_service.validate_ner_bounds(12.9716, 77.5946) is False  # Bangalore outside NER
