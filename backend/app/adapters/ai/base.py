"""AI Integration Interfaces / Protocols."""

from typing import Dict, List, Optional, Protocol, Union
from pydantic import BaseModel
from app.schemas.enums import IncidentCategory, IncidentSeverity


class ClassifiedIncidentResult(BaseModel):
    category: IncidentCategory
    severity: IncidentSeverity
    confidence: float
    extracted_keywords: List[str] = []
    is_fallback: bool = False


class SegmentRiskResult(BaseModel):
    segment_id: Union[str, int]
    risk_score: float
    risk_level: str
    contributing_factors: Dict[str, float] = {}
    recommendations: List[str] = []
    is_fallback: bool = False


class EstimatedDelayResult(BaseModel):
    nominal_duration_hours: float
    estimated_delay_hours: float
    total_expected_duration_hours: float
    bottleneck_buffer_hours: float = 0.0
    is_fallback: bool = False


class IncidentClassifierProtocol(Protocol):
    async def classify_incident_text(self, text: str) -> ClassifiedIncidentResult:
        ...


class RiskPredictorProtocol(Protocol):
    async def predict_segment_risk(
        self,
        segment_id: Union[str, int],
        rainfall_mm: float,
        active_incidents_count: int,
        historical_failure_rate: float,
        terrain_slope_deg: float,
    ) -> SegmentRiskResult:
        ...


class DelayEstimatorProtocol(Protocol):
    async def estimate_delay(
        self,
        distance_km: float,
        base_speed_kmh: float,
        segment_risk_scores: List[float],
        active_bottlenecks_count: int,
    ) -> EstimatedDelayResult:
        ...
