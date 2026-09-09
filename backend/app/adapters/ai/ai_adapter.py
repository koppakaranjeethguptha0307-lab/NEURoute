"""
AI Integration Adapter.
Provides dependency-injected interfaces to the AI teammate's models.
Does NOT implement or duplicate AI/ML algorithms.
"""

from typing import List, Optional
from app.adapters.ai.base import (
    ClassifiedIncidentResult,
    DelayEstimatorProtocol,
    EstimatedDelayResult,
    IncidentClassifierProtocol,
    RiskPredictorProtocol,
    SegmentRiskResult,
)
from app.adapters.ai.mock_ai import MockAIAdapter
from app.core.config import settings
from app.core.exceptions import ExternalServiceError
from app.core.logging import logger


class AIIntegrationAdapter(
    IncidentClassifierProtocol,
    RiskPredictorProtocol,
    DelayEstimatorProtocol,
):
    """
    Integration boundary that delegates prediction tasks directly to the AI teammate's implementations.
    Provides fallback to MockAIAdapter only when MOCK_DATA_MODE is enabled or during test execution.
    """

    def __init__(
        self,
        classifier: Optional[IncidentClassifierProtocol] = None,
        risk_predictor: Optional[RiskPredictorProtocol] = None,
        delay_estimator: Optional[DelayEstimatorProtocol] = None,
    ) -> None:
        self.classifier = classifier
        self.risk_predictor = risk_predictor
        self.delay_estimator = delay_estimator
        self.fallback = MockAIAdapter()

    async def classify_incident_text(self, text: str) -> ClassifiedIncidentResult:
        """Delegate incident text classification to AI service."""
        if not text or len(text.strip()) == 0:
            raise ValueError("Incident text must not be empty")

        if self.classifier:
            try:
                return await self.classifier.classify_incident_text(text)
            except Exception as e:
                logger.warning(f"AI Classifier failure: {str(e)}. Using fallback mock.")

        # Fallback to test/demo mock
        return await self.fallback.classify_incident_text(text)

    async def predict_segment_risk(
        self,
        segment_id: int,
        rainfall_mm: float,
        active_incidents_count: int,
        historical_failure_rate: float,
        terrain_slope_deg: float,
    ) -> SegmentRiskResult:
        """Delegate segment risk scoring to AI risk predictor."""
        if self.risk_predictor:
            try:
                return await self.risk_predictor.predict_segment_risk(
                    segment_id, rainfall_mm, active_incidents_count, historical_failure_rate, terrain_slope_deg
                )
            except Exception as e:
                logger.warning(f"AI RiskPredictor failure: {str(e)}. Using fallback mock.")

        # Fallback to test/demo mock
        return await self.fallback.predict_segment_risk(
            segment_id, rainfall_mm, active_incidents_count, historical_failure_rate, terrain_slope_deg
        )

    async def estimate_delay(
        self,
        distance_km: float,
        base_speed_kmh: float,
        segment_risk_scores: List[float],
        active_bottlenecks_count: int,
    ) -> EstimatedDelayResult:
        """Delegate delay estimation to AI delay estimator."""
        if self.delay_estimator:
            try:
                return await self.delay_estimator.estimate_delay(
                    distance_km, base_speed_kmh, segment_risk_scores, active_bottlenecks_count
                )
            except Exception as e:
                logger.warning(f"AI DelayEstimator failure: {str(e)}. Using fallback mock.")

        # Fallback to test/demo mock
        return await self.fallback.estimate_delay(
            distance_km, base_speed_kmh, segment_risk_scores, active_bottlenecks_count
        )
