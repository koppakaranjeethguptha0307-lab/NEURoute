"""
NEURoute Backend Schemas — AI / Prediction Module
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara

Pydantic v2 schemas for AI REST API requests and responses.
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


# Incident Classification Schemas
class IncidentClassificationInput(BaseModel):
    text: str = Field(..., description="Unstructured incident report description", json_schema_extra={"example": "Heavy landslide blocking NH-06 near Sonapur"})


class IncidentClassificationOutput(BaseModel):
    category: str = Field(..., json_schema_extra={"example": "LANDSLIDE"})
    severity: str = Field(..., json_schema_extra={"example": "HIGH"})
    confidence: float = Field(..., ge=0.0, le=1.0, json_schema_extra={"example": 0.95})


# Risk Prediction Schemas
class IncidentInfo(BaseModel):
    category: Optional[str] = "OTHER"
    severity: Optional[str] = "LOW"
    distance_km: Optional[float] = 0.0
    status: Optional[str] = "ACTIVE"


class RiskPredictionInput(BaseModel):
    segment_id: str = Field(..., json_schema_extra={"example": "seg-nh06-03"})
    rainfall_mm: float = Field(default=0.0, ge=0.0)
    visibility_meters: float = Field(default=10000.0, ge=0.0)
    weather_advisory: Optional[str] = None
    hazard_type: Optional[str] = None
    hazard_severity: str = Field(default="LOW")
    hazard_distance_km: float = Field(default=0.0, ge=0.0)
    active_incidents: Optional[List[Dict[str, Any]]] = None
    historical_frequency: float = Field(default=0.10, ge=0.0, le=1.0)
    trend: str = Field(default="STABLE")


class RiskComponents(BaseModel):
    weather_norm: float
    hazard_prox: float
    incident_active: float
    historical_freq: float
    trend_slope: float


class RiskPredictionOutput(BaseModel):
    segment_id: str
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: str
    reasons: List[str]
    is_disrupted: bool
    components: RiskComponents


# Delay Prediction Schemas
class DelayPredictionInput(BaseModel):
    distance_km: float = Field(..., gt=0.0, json_schema_extra={"example": 80.0})
    base_speed_kmh: float = Field(default=50.0, gt=0.0, json_schema_extra={"example": 60.0})
    impaired_speed_kmh: Optional[float] = Field(default=None, gt=0.0)
    current_status: str = Field(default="OPEN", json_schema_extra={"example": "RISKY"})
    incident_severity: Optional[str] = Field(default=None)
    bottleneck_clearance_minutes: float = Field(default=0.0, ge=0.0)
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0)


class DelayPredictionOutput(BaseModel):
    normal_travel_minutes: int
    estimated_travel_minutes: int
    delay_minutes: int
    delay_percentage: float
    is_blocked: bool
    causes: List[str]


# Route Optimization Schemas
class RouteOptimizationInput(BaseModel):
    candidate_routes: List[Dict[str, Any]] = Field(..., description="List of candidate routes with segment details")
    cargo_priority: str = Field(default="STANDARD", json_schema_extra={"example": "CRITICAL"})
    preference: str = Field(default="SAFEST", json_schema_extra={"example": "SAFEST"})


class RouteOptimizationOutput(BaseModel):
    recommended_route_id: Optional[str]
    recommendation_type: str
    routes: List[Dict[str, Any]]
    reason: str
