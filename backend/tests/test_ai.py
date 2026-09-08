"""
NEURoute AI Unit & Integration Test Suite
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara

Comprehensive tests for:
- Incident Classifier
- Segment Risk Predictor & Disruption Engine
- Travel Delay Estimator
- Multi-Criteria Route Optimizer
- FastAPI REST Endpoints (/api/v1/ai/*)
- SIH End-to-End Acceptance Scenario
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from ai.services.classifier import IncidentClassifier, classify_incident
from ai.services.risk_predictor import RiskPredictor, predict_road_risk
from ai.services.delay_estimator import DelayEstimator, estimate_travel_delay
from ai.services.route_optimizer import RouteOptimizer, optimize_routes
from fastapi import FastAPI
from backend.app.api.routes import ai

ai_test_app = FastAPI()
ai_test_app.include_router(ai.router)
client = TestClient(ai_test_app)


# ============================================================================
# 1. INCIDENT CLASSIFIER TESTS
# ============================================================================

def test_classifier_landslide():
    res = classify_incident("Heavy landslide blocking NH-06 near Sonapur tunnel")
    assert res["category"] == "LANDSLIDE"
    assert res["severity"] in ["HIGH", "CRITICAL"]
    assert 0.0 <= res["confidence"] <= 1.0


def test_classifier_flood():
    res = classify_incident("Flood water covering road near Kaziranga national park")
    assert res["category"] == "FLOOD"
    assert res["severity"] in ["HIGH", "CRITICAL"]


def test_classifier_bridge_issue():
    res = classify_incident("Bridge damaged after heavy rainfall near Silchar")
    assert res["category"] == "BRIDGE_ISSUE"
    assert res["severity"] in ["HIGH", "CRITICAL"]


def test_classifier_road_blockage():
    res = classify_incident("Vehicle accident completely blocking one lane")
    assert res["category"] in ["ROAD_BLOCKAGE", "TRAFFIC_CONGESTION"]
    assert res["severity"] in ["MEDIUM", "HIGH"]


def test_classifier_unknown_or_empty_text():
    res1 = classify_incident("")
    assert res1["category"] == "OTHER"
    assert res1["severity"] == "LOW"

    res2 = classify_incident("Random text without keywords 12345")
    assert res2["category"] == "OTHER"
    assert res2["confidence"] <= 0.60

    # Test malformed / non-string inputs
    res3 = classify_incident(None)
    assert res3["category"] == "OTHER"

    res4 = classify_incident("   \n\t   ")
    assert res4["category"] == "OTHER"


# ============================================================================
# 2. RISK PREDICTOR & DISRUPTION TESTS
# ============================================================================

def test_risk_predictor_low_risk():
    res = predict_road_risk(
        segment_id="seg-nh06-01",
        rainfall_mm=0.0,
        visibility_meters=10000.0,
        historical_frequency=0.05,
        trend="STABLE"
    )
    assert res["risk_score"] < 0.30
    assert res["risk_level"] == "LOW"
    assert res["is_disrupted"] is False
    assert len(res["reasons"]) > 0


def test_risk_predictor_high_weather_impact():
    res = predict_road_risk(
        segment_id="seg-nh06-02",
        rainfall_mm=85.0,
        visibility_meters=400.0,
        weather_advisory="Torrential rainfall hazard advisory",
        historical_frequency=0.50,
        trend="INCREASING"
    )
    assert res["risk_score"] >= 0.35
    assert res["risk_level"] in ["MEDIUM", "HIGH"]
    assert any("rainfall" in r.lower() for r in res["reasons"])


def test_risk_predictor_active_incident_and_cap():
    res = predict_road_risk(
        segment_id="seg-nh06-03",
        rainfall_mm=120.0,
        hazard_type="LANDSLIDE_PRONE_ZONE",
        hazard_severity="CRITICAL",
        hazard_distance_km=0.1,
        active_incidents=[
            {"category": "LANDSLIDE", "severity": "CRITICAL", "distance_km": 0.0, "status": "ACTIVE"}
        ],
        historical_frequency=0.90,
        trend="INCREASING"
    )
    assert res["risk_score"] <= 1.0
    assert res["risk_score"] >= 0.70
    assert res["risk_level"] in ["HIGH", "CRITICAL"]
    assert res["is_disrupted"] is True
    assert any("Active Landslide detected" in r for r in res["reasons"])


# ============================================================================
# 3. TRAVEL DELAY ESTIMATOR TESTS
# ============================================================================

def test_delay_estimator_normal_road():
    res = estimate_travel_delay(distance_km=60.0, base_speed_kmh=60.0)
    assert res["normal_travel_minutes"] == 60
    assert res["estimated_travel_minutes"] == 60
    assert res["delay_minutes"] == 0
    assert res["is_blocked"] is False


def test_delay_estimator_impaired_road():
    res = estimate_travel_delay(
        distance_km=60.0,
        base_speed_kmh=60.0,
        impaired_speed_kmh=30.0,
        incident_severity="HIGH",
        bottleneck_clearance_minutes=20.0
    )
    assert res["normal_travel_minutes"] == 60
    assert res["estimated_travel_minutes"] == 170  # (60/30)*60 + 20 + 30
    assert res["delay_minutes"] == 110
    assert res["delay_minutes"] >= 0


def test_delay_estimator_blocked_road():
    res = estimate_travel_delay(
        distance_km=38.0,
        base_speed_kmh=40.0,
        current_status="BLOCKED"
    )
    assert res["is_blocked"] is True
    assert res["delay_minutes"] > 0
    assert "Road segment is completely BLOCKED" in res["causes"][0]


def test_delay_estimator_zero_speed_handling():
    res = estimate_travel_delay(distance_km=50.0, base_speed_kmh=0.0, impaired_speed_kmh=0.0)
    assert res["normal_travel_minutes"] > 0
    assert res["delay_minutes"] >= 0


# ============================================================================
# 4. ROUTE OPTIMIZER TESTS
# ============================================================================

def test_route_optimizer_safest_vs_fastest():
    candidate_routes = [
        {
            "route_id": "route_1",
            "route_name": "NH-06 Highway Main",
            "distance_km": 90.0,
            "travel_time_minutes": 80.0,
            "risk_score": 0.85,
            "segments": [{"name": "Sonapur Stretch", "status": "BLOCKED"}]
        },
        {
            "route_id": "route_2",
            "route_name": "Shillong Bypass Alternate",
            "distance_km": 110.0,
            "travel_time_minutes": 105.0,
            "risk_score": 0.20,
            "segments": [{"name": "Bypass Lifeline", "status": "OPEN"}]
        }
    ]

    res = optimize_routes(candidate_routes, cargo_priority="STANDARD", preference="SAFEST")
    assert res["recommended_route_id"] == "route_2"
    assert res["recommendation_type"] == "SAFEST"
    assert "Shillong Bypass Alternate" in res["reason"]


def test_route_optimizer_critical_cargo_priority():
    candidate_routes = [
        {
            "route_id": "route_fast",
            "route_name": "Fast Expressway",
            "distance_km": 70.0,
            "travel_time_minutes": 50.0,
            "risk_score": 0.65,
            "segments": [{"name": "Landslide Hazard Zone", "status": "RISKY"}]
        },
        {
            "route_id": "route_safe",
            "route_name": "Lifeline Relief Route",
            "distance_km": 85.0,
            "travel_time_minutes": 70.0,
            "risk_score": 0.15,
            "segments": [{"name": "Safe Highway", "status": "OPEN"}]
        }
    ]

    res = optimize_routes(candidate_routes, cargo_priority="CRITICAL")
    assert res["recommended_route_id"] == "route_safe"
    assert res["recommendation_type"] == "PRIORITY_LIFELINE"
    assert "CRITICAL cargo safety weighting" in res["reason"]


# ============================================================================
# 5. FASTAPI REST ENDPOINTS INTEGRATION TESTS
# ============================================================================

def test_api_classify_incident():
    response = client.post(
        "/api/v1/ai/classify-incident",
        json={"text": "Heavy landslide blocking NH-06 near Sonapur"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["category"] == "LANDSLIDE"
    assert data["severity"] in ["HIGH", "CRITICAL"]


def test_api_risk_prediction():
    response = client.post(
        "/api/v1/ai/risk",
        json={
            "segment_id": "seg-nh06-03",
            "rainfall_mm": 90.0,
            "weather_advisory": "Storm warning",
            "active_incidents": [{"category": "LANDSLIDE", "severity": "HIGH", "distance_km": 0.2}],
            "trend": "INCREASING"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["segment_id"] == "seg-nh06-03"
    assert data["risk_score"] > 0.0
    assert isinstance(data["reasons"], list)
    assert data["is_disrupted"] is True


def test_api_delay_estimation():
    response = client.post(
        "/api/v1/ai/delay",
        json={
            "distance_km": 100.0,
            "base_speed_kmh": 50.0,
            "current_status": "RISKY",
            "risk_score": 0.65
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["normal_travel_minutes"] == 120
    assert data["delay_minutes"] > 0


def test_api_route_optimization():
    routes_payload = {
        "candidate_routes": [
            {
                "route_id": "r1",
                "route_name": "NH-06 Main",
                "distance_km": 100,
                "travel_time_minutes": 90,
                "risk_score": 0.88,
                "segments": [{"name": "Sonapur Tunnel", "status": "BLOCKED"}]
            },
            {
                "route_id": "r2",
                "route_name": "Shillong Bypass Alternate",
                "distance_km": 115,
                "travel_time_minutes": 110,
                "risk_score": 0.22,
                "segments": [{"name": "Bypass Segment", "status": "OPEN"}]
            }
        ],
        "cargo_priority": "CRITICAL"
    }

    response = client.post("/api/v1/ai/optimize-route", json=routes_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["recommended_route_id"] == "r2"
    assert data["recommendation_type"] == "PRIORITY_LIFELINE"


# ============================================================================
# 6. SIH END-TO-END ACCEPTANCE SCENARIO
# ============================================================================

def test_sih_end_to_end_acceptance_scenario():
    """
    SIH Acceptance Scenario Verification:
    1. Incident report: Landslide on NH-06 with HIGH severity.
    2. Segment seg-nh06-03 affected.
    3. Risk prediction gives HIGH/CRITICAL risk.
    4. Segment marked BLOCKED.
    5. Guwahati -> Silchar route evaluated for CRITICAL medicine cargo.
    6. Safety weight 0.50 applied, recommends route avoiding blocked segment.
    7. Delay estimation calculates expected disruption delay.
    8. All steps explainable.
    """
    # 1. Incident Classification
    incident_text = "Heavy landslide blocking NH-06 near Sonapur with high severity debris"
    cls_res = classify_incident(incident_text)
    assert cls_res["category"] == "LANDSLIDE"
    assert cls_res["severity"] in ["HIGH", "CRITICAL"]

    # 2 & 3. Segment Risk & Disruption Prediction
    risk_res = predict_road_risk(
        segment_id="seg-nh06-03",
        rainfall_mm=85.0,
        weather_advisory="Torrential monsoon rain in Meghalaya / Jaintia hills",
        active_incidents=[
            {
                "category": cls_res["category"],
                "severity": cls_res["severity"],
                "distance_km": 0.0,
                "status": "ACTIVE"
            }
        ],
        trend="INCREASING"
    )
    assert risk_res["risk_level"] in ["HIGH", "CRITICAL"]
    assert risk_res["is_disrupted"] is True
    assert len(risk_res["reasons"]) >= 2

    # 4 & 5 & 6. Route Optimization for Guwahati -> Silchar CRITICAL Medicine Shipment
    candidate_routes = [
        {
            "route_id": "route_nh06_direct",
            "route_name": "NH-06 Direct Guwahati-Shillong-Silchar",
            "distance_km": 210.0,
            "travel_time_minutes": 270.0,
            "risk_score": risk_res["risk_score"],
            "segments": [
                {"name": "NH-06 Guwahati-Jorabat", "status": "OPEN"},
                {"name": "NH-06 Sonapur Tunnel", "status": "BLOCKED", "risk_score": risk_res["risk_score"]}
            ]
        },
        {
            "route_id": "route_bypass_alt",
            "route_name": "Shillong Eastern Bypass Lifeline Route",
            "distance_km": 245.0,
            "travel_time_minutes": 310.0,
            "risk_score": 0.22,
            "segments": [
                {"name": "Shillong Bypass", "status": "OPEN", "risk_score": 0.22},
                {"name": "NH-06 Malidor-Silchar", "status": "OPEN", "risk_score": 0.25}
            ]
        }
    ]

    opt_res = optimize_routes(candidate_routes, cargo_priority="CRITICAL")
    assert opt_res["recommended_route_id"] == "route_bypass_alt"
    assert opt_res["recommendation_type"] == "PRIORITY_LIFELINE"
    assert "Shillong Eastern Bypass Lifeline Route" in opt_res["reason"]
    assert "avoids blocked route" in opt_res["reason"]

    # 7. Travel Delay Estimation on Blocked vs Alternate
    direct_delay = estimate_travel_delay(
        distance_km=210.0,
        base_speed_kmh=45.0,
        current_status="BLOCKED",
        risk_score=risk_res["risk_score"]
    )
    alt_delay = estimate_travel_delay(
        distance_km=245.0,
        base_speed_kmh=50.0,
        current_status="OPEN",
        risk_score=0.22
    )

    assert direct_delay["is_blocked"] is True
    assert alt_delay["is_blocked"] is False
    assert direct_delay["delay_minutes"] > alt_delay["delay_minutes"]


def test_delay_estimator_unknown_status():
    res = estimate_travel_delay(
        distance_km=50.0,
        base_speed_kmh=50.0,
        current_status="UNKNOWN"
    )
    assert res["delay_minutes"] > 0
    assert any("Unknown road segment condition" in c for c in res["causes"])


def test_route_optimizer_unknown_segment():
    candidate_routes = [
        {
            "route_id": "route_known",
            "route_name": "Known Route",
            "distance_km": 50.0,
            "travel_time_minutes": 60.0,
            "risk_score": 0.15,
            "segments": [{"name": "Segment A", "status": "OPEN"}]
        },
        {
            "route_id": "route_unknown",
            "route_name": "Route With Unknown Segment",
            "distance_km": 50.0,
            "travel_time_minutes": 60.0,
            "risk_score": 0.15,
            "segments": [{"name": "Segment B", "status": "UNKNOWN"}]
        }
    ]
    res = optimize_routes(candidate_routes, cargo_priority="STANDARD", preference="SAFEST")
    assert res["recommended_route_id"] == "route_known"


def test_prediction_model_schema_compatibility():
    """
    Verify that AI outputs can be directly mapped to the existing database predictions model:
    - prediction_type IN ('RISK_SCORE', 'DELAY_MINUTES', 'INCIDENT_CLASSIFICATION', 'ACCESSIBILITY_INDEX', 'CLEARANCE_TIME')
    - target_entity_type IN ('ROUTE', 'ROAD_SEGMENT', 'INCIDENT', 'TRIP', 'DISTRICT', 'SHIPMENT')
    """
    import json

    # 1. Incident classification to prediction record format
    cls_res = classify_incident("Landslide blocking NH-06")
    pred_record_cls = {
        "prediction_type": "INCIDENT_CLASSIFICATION",
        "target_entity_type": "INCIDENT",
        "target_entity_id": "inc-demo-01",
        "predicted_value": json.dumps(cls_res),
        "confidence": cls_res["confidence"],
        "model_version": "v1.0.0-rule-heuristic",
        "input_features": json.dumps({"text": "Landslide blocking NH-06"}),
        "method": "RULE_HEURISTIC"
    }
    assert pred_record_cls["prediction_type"] in ['RISK_SCORE', 'DELAY_MINUTES', 'INCIDENT_CLASSIFICATION', 'ACCESSIBILITY_INDEX', 'CLEARANCE_TIME']
    assert pred_record_cls["target_entity_type"] in ['ROUTE', 'ROAD_SEGMENT', 'INCIDENT', 'TRIP', 'DISTRICT', 'SHIPMENT']
    assert 0.0 <= pred_record_cls["confidence"] <= 1.0

    # 2. Risk prediction to prediction record format
    risk_res = predict_road_risk("seg-nh06-03", rainfall_mm=50.0)
    pred_record_risk = {
        "prediction_type": "RISK_SCORE",
        "target_entity_type": "ROAD_SEGMENT",
        "target_entity_id": risk_res["segment_id"],
        "predicted_value": str(risk_res["risk_score"]),
        "confidence": 0.90,
        "model_version": "v1.0.0-scoring-baseline",
        "input_features": json.dumps(risk_res["components"]),
        "method": "MULTI_FACTOR_WEIGHTED"
    }
    assert pred_record_risk["prediction_type"] in ['RISK_SCORE', 'DELAY_MINUTES', 'INCIDENT_CLASSIFICATION', 'ACCESSIBILITY_INDEX', 'CLEARANCE_TIME']
    assert pred_record_risk["target_entity_type"] in ['ROUTE', 'ROAD_SEGMENT', 'INCIDENT', 'TRIP', 'DISTRICT', 'SHIPMENT']

    # 3. Delay estimation to prediction record format
    delay_res = estimate_travel_delay(distance_km=45.0, base_speed_kmh=50.0)
    pred_record_delay = {
        "prediction_type": "DELAY_MINUTES",
        "target_entity_type": "TRIP",
        "target_entity_id": "trip-demo-01",
        "predicted_value": str(delay_res["delay_minutes"]),
        "confidence": 0.85,
        "model_version": "v1.0.0-kinematic-bottleneck",
        "input_features": json.dumps({"normal_min": delay_res["normal_travel_minutes"], "est_min": delay_res["estimated_travel_minutes"]}),
        "method": "KINEMATIC_CLEARANCE_HEURISTIC"
    }
    assert pred_record_delay["prediction_type"] in ['RISK_SCORE', 'DELAY_MINUTES', 'INCIDENT_CLASSIFICATION', 'ACCESSIBILITY_INDEX', 'CLEARANCE_TIME']
    assert pred_record_delay["target_entity_type"] in ['ROUTE', 'ROAD_SEGMENT', 'INCIDENT', 'TRIP', 'DISTRICT', 'SHIPMENT']

