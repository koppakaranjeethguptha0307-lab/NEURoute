"""
NEURoute Backend Routes — AI / Prediction API Router
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara

Exposes AI intelligence services via REST endpoints under /api/v1/ai/*:
- POST /api/v1/ai/classify-incident
- POST /api/v1/ai/risk
- POST /api/v1/ai/delay
- POST /api/v1/ai/optimize-route
"""

from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_ai_service
from app.services.ai_service import AIService
from app.schemas.ai import (
    IncidentClassificationInput,
    IncidentClassificationOutput,
    RiskPredictionInput,
    RiskPredictionOutput,
    DelayPredictionInput,
    DelayPredictionOutput,
    RouteOptimizationInput,
    RouteOptimizationOutput,
)

router = APIRouter(prefix="/api/v1/ai", tags=["AI Intelligence"])


@router.post(
    "/classify-incident",
    response_model=IncidentClassificationOutput,
    summary="Classify incident description text"
)
def classify_incident_endpoint(
    payload: IncidentClassificationInput,
    ai_service: AIService = Depends(get_ai_service)
):
    """
    Classify incident text into category, severity, and confidence score,
    and persist prediction record in the database.
    """
    try:
        res = ai_service.classify_incident_text(payload.text)
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Classification error: {str(e)}"
        )


@router.post(
    "/risk",
    response_model=RiskPredictionOutput,
    summary="Predict road segment risk score and disruption status"
)
def predict_risk_endpoint(
    payload: RiskPredictionInput,
    ai_service: AIService = Depends(get_ai_service)
):
    """
    Calculate composite road segment risk score, risk level, explainable reasons,
    and disruption status, and persist prediction record in the database.
    """
    try:
        res = ai_service.predict_risk(
            segment_id=payload.segment_id,
            rainfall_mm=payload.rainfall_mm,
            visibility_meters=payload.visibility_meters,
            weather_advisory=payload.weather_advisory,
            hazard_type=payload.hazard_type,
            hazard_severity=payload.hazard_severity,
            hazard_distance_km=payload.hazard_distance_km,
            active_incidents=payload.active_incidents,
            historical_frequency=payload.historical_frequency,
            trend=payload.trend
        )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk prediction error: {str(e)}"
        )


@router.post(
    "/delay",
    response_model=DelayPredictionOutput,
    summary="Estimate travel time and disruption delays"
)
def predict_delay_endpoint(
    payload: DelayPredictionInput,
    ai_service: AIService = Depends(get_ai_service)
):
    """
    Calculate normal vs. impaired travel time, delay minutes, and percentage,
    and persist prediction record in the database.
    """
    try:
        res = ai_service.estimate_delay(
            distance_km=payload.distance_km,
            base_speed_kmh=payload.base_speed_kmh,
            impaired_speed_kmh=payload.impaired_speed_kmh,
            current_status=payload.current_status,
            incident_severity=payload.incident_severity,
            bottleneck_clearance_minutes=payload.bottleneck_clearance_minutes,
            risk_score=payload.risk_score
        )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Delay estimation error: {str(e)}"
        )


@router.post(
    "/optimize-route",
    response_model=RouteOptimizationOutput,
    summary="Optimize route candidate selection based on risk and priority"
)
def optimize_route_endpoint(
    payload: RouteOptimizationInput,
    ai_service: AIService = Depends(get_ai_service)
):
    """
    Compare candidate routes and recommend optimal route with explainable rationale,
    and persist prediction record in the database.
    """
    try:
        res = ai_service.optimize_routes(
            candidate_routes=payload.candidate_routes,
            cargo_priority=payload.cargo_priority,
            preference=payload.preference
        )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Route optimization error: {str(e)}"
        )


@router.get(
    "/predictions",
    summary="Retrieve persisted AI predictions"
)
def get_predictions_endpoint(
    limit: int = 50,
    ai_service: AIService = Depends(get_ai_service)
):
    """
    Retrieve stored predictions from the database.
    """
    try:
        predictions = ai_service.get_predictions(limit=limit)
        return [
            {
                "id": p.id,
                "prediction_type": p.prediction_type,
                "target_entity_type": p.target_entity_type,
                "target_entity_id": p.target_entity_id,
                "predicted_value": p.predicted_value,
                "confidence": p.confidence,
                "risk_score": p.risk_score,
                "risk_level": p.risk_level,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in predictions
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch predictions: {str(e)}"
        )
