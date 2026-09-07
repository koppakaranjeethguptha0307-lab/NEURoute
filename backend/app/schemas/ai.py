"""AI integration schemas for risk, delay and incident classification."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.enums import IncidentCategory, IncidentSeverity


class IncidentClassificationRequest(BaseModel):
    text: str = Field(..., min_length=5, description="Incident description or field observation")
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class IncidentClassificationResponse(BaseModel):
    predicted_category: IncidentCategory
    suggested_severity: IncidentSeverity
    confidence: float = Field(..., ge=0.0, le=1.0)
    extracted_keywords: List[str] = []
    is_fallback: bool = False


class RiskPredictionRequest(BaseModel):
    segment_id: int
    rainfall_mm: float = 0.0
    active_incidents_count: int = 0
    historical_failure_rate: float = 0.0
    terrain_slope_deg: float = 0.0
    elevation_m: float = 0.0


class RiskPredictionResponse(BaseModel):
    segment_id: int
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: str
    contributing_factors: Dict[str, float] = {}
    recommendations: List[str] = []
    is_fallback: bool = False


class DelayEstimationRequest(BaseModel):
    route_distance_km: float
    base_speed_kmh: float = 40.0
    segment_risk_scores: List[float] = []
    active_bottlenecks_count: int = 0
    rainfall_intensity_mm: float = 0.0


class DelayEstimationResponse(BaseModel):
    nominal_duration_hours: float
    estimated_delay_hours: float
    total_expected_duration_hours: float
    confidence_interval_hours: List[float] = []
    bottleneck_buffer_hours: float = 0.0
    is_fallback: bool = False
