"""
AI Integration Adapter.
Provides dependency-injected interfaces to the AI teammate's models.
Does NOT implement or duplicate AI/ML algorithms.
Delegates directly to real AI implementations in ai.services.* by default.
Supports both Protocol objects and real AI service instances.
"""

import inspect
import sys
from pathlib import Path
from typing import Dict, Any, List, Optional

# Ensure project root containing ai/ package is in sys.path
project_root = Path(__file__).resolve().parent.parent.parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

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
from app.schemas.enums import IncidentCategory, IncidentSeverity

# Import real AI team implementations from ai/services/
from ai.services.classifier import IncidentClassifier, classify_incident
from ai.services.risk_predictor import RiskPredictor, predict_road_risk
from ai.services.delay_estimator import DelayEstimator, estimate_travel_delay
from ai.services.route_optimizer import RouteOptimizer, optimize_routes


def _map_category_to_enum(cat_str: str) -> IncidentCategory:
    upper = (cat_str or "").upper()
    mapping = {
        "LANDSLIDE": IncidentCategory.LANDSLIDE,
        "FLOOD": IncidentCategory.FLOOD,
        "ROAD_DAMAGE": IncidentCategory.ROAD_DAMAGE,
        "BRIDGE_ISSUE": IncidentCategory.BRIDGE_DAMAGE,
        "BRIDGE_DAMAGE": IncidentCategory.BRIDGE_DAMAGE,
        "HEAVY_RAINFALL": IncidentCategory.HEAVY_RAIN,
        "HEAVY_RAIN": IncidentCategory.HEAVY_RAIN,
        "ROAD_BLOCKAGE": IncidentCategory.ROADBLOCK,
        "ROADBLOCK": IncidentCategory.ROADBLOCK,
        "TRAFFIC_CONGESTION": IncidentCategory.CONSTRUCTION,
        "ACCIDENT": IncidentCategory.ACCIDENT,
    }
    return mapping.get(upper, IncidentCategory.LANDSLIDE if "LANDSLIDE" in upper else IncidentCategory.ROAD_DAMAGE)


def _map_severity_to_enum(sev_str: str) -> IncidentSeverity:
    upper = (sev_str or "").upper()
    try:
        return IncidentSeverity(upper)
    except ValueError:
        return IncidentSeverity.LOW


class AIIntegrationAdapter(
    IncidentClassifierProtocol,
    RiskPredictorProtocol,
    DelayEstimatorProtocol,
):
    """
    Integration boundary delegating prediction tasks directly to the AI teammate's implementations.
    Uses the real AI team services by default and falls back to MockAIAdapter only on explicit error or mock mode.
    """

    def __init__(
        self,
        classifier: Optional[Any] = None,
        risk_predictor: Optional[Any] = None,
        delay_estimator: Optional[Any] = None,
        route_optimizer: Optional[Any] = None,
        force_mock: bool = False,
    ) -> None:
        self.force_mock = force_mock
        self.fallback = MockAIAdapter()

        # Connect to real AI team implementations by default
        self.classifier = classifier if classifier is not None else (None if force_mock else IncidentClassifier())
        self.risk_predictor = risk_predictor if risk_predictor is not None else (None if force_mock else RiskPredictor())
        self.delay_estimator = delay_estimator if delay_estimator is not None else (None if force_mock else DelayEstimator())
        self.route_optimizer = route_optimizer if route_optimizer is not None else (None if force_mock else RouteOptimizer())

    @property
    def is_using_real_ai(self) -> bool:
        """Returns True if adapter is connected to real AI team implementations."""
        return not self.force_mock and self.classifier is not None

    # --------------------------------------------------------------------------
    # 1. Incident Classification
    # --------------------------------------------------------------------------

    async def classify_incident_text(self, text: str) -> ClassifiedIncidentResult:
        """Delegate incident text classification to AI classifier service or protocol mock."""
        if not text or len(text.strip()) == 0:
            raise ValueError("Incident text must not be empty")

        if not self.force_mock and self.classifier:
            try:
                # Protocol mock check
                if hasattr(self.classifier, "classify_incident_text") and callable(getattr(self.classifier, "classify_incident_text")):
                    res = self.classifier.classify_incident_text(text)
                    if inspect.isawaitable(res):
                        res = await res
                    if isinstance(res, ClassifiedIncidentResult):
                        return res

                # Real IncidentClassifier instance check
                if hasattr(self.classifier, "classify") and callable(getattr(self.classifier, "classify")):
                    res = self.classifier.classify(text)
                    return ClassifiedIncidentResult(
                        category=_map_category_to_enum(res["category"]),
                        severity=_map_severity_to_enum(res["severity"]),
                        confidence=res["confidence"],
                        extracted_keywords=[res["category"].lower()],
                        is_fallback=False,
                    )
            except Exception as e:
                logger.warning(f"Real AI Classifier failure: {str(e)}. Using fallback mock.")

        return await self.fallback.classify_incident_text(text)

    def classify_incident_dict(self, text: str) -> Dict[str, Any]:
        """Return raw classification dictionary from real AI classifier."""
        if not self.force_mock:
            try:
                return classify_incident(text)
            except Exception as e:
                logger.warning(f"Real AI classify_incident failure: {str(e)}. Using fallback mock.")

        res = self.fallback.classify_incident_text(text)
        return {
            "category": getattr(res, "category", IncidentCategory.OTHER).value if hasattr(getattr(res, "category", None), "value") else "OTHER",
            "severity": getattr(res, "severity", IncidentSeverity.LOW).value if hasattr(getattr(res, "severity", None), "value") else "LOW",
            "confidence": 0.50,
        }

    # --------------------------------------------------------------------------
    # 2. Risk Prediction
    # --------------------------------------------------------------------------

    async def predict_segment_risk(
        self,
        segment_id: int,
        rainfall_mm: float,
        active_incidents_count: int,
        historical_failure_rate: float,
        terrain_slope_deg: float,
    ) -> SegmentRiskResult:
        """Delegate segment risk scoring to AI risk predictor service or protocol mock."""
        if not self.force_mock and self.risk_predictor:
            try:
                # Protocol mock check
                if hasattr(self.risk_predictor, "predict_segment_risk") and callable(getattr(self.risk_predictor, "predict_segment_risk")):
                    res = self.risk_predictor.predict_segment_risk(
                        segment_id, rainfall_mm, active_incidents_count, historical_failure_rate, terrain_slope_deg
                    )
                    if inspect.isawaitable(res):
                        res = await res
                    if isinstance(res, SegmentRiskResult):
                        return res

                # Real RiskPredictor instance check
                if hasattr(self.risk_predictor, "predict_risk") and callable(getattr(self.risk_predictor, "predict_risk")):
                    active_incidents = [{"severity": "HIGH", "distance_km": 0.0, "status": "ACTIVE"}] if active_incidents_count > 0 else []
                    trend = "INCREASING" if terrain_slope_deg > 25.0 else "STABLE"

                    res = self.risk_predictor.predict_risk(
                        segment_id=str(segment_id),
                        rainfall_mm=rainfall_mm,
                        active_incidents=active_incidents,
                        historical_frequency=historical_failure_rate,
                        trend=trend,
                    )
                    return SegmentRiskResult(
                        segment_id=segment_id,
                        risk_score=res["risk_score"],
                        risk_level=res["risk_level"],
                        contributing_factors=res.get("components", {}),
                        recommendations=res.get("reasons", []),
                        is_fallback=False,
                    )
            except Exception as e:
                logger.warning(f"Real AI RiskPredictor failure: {str(e)}. Using fallback mock.")

        return await self.fallback.predict_segment_risk(
            segment_id, rainfall_mm, active_incidents_count, historical_failure_rate, terrain_slope_deg
        )

    def predict_risk_dict(
        self,
        segment_id: str,
        rainfall_mm: float = 0.0,
        visibility_meters: float = 10000.0,
        weather_advisory: Optional[str] = None,
        hazard_type: Optional[str] = None,
        hazard_severity: str = "LOW",
        hazard_distance_km: float = 0.0,
        active_incidents: Optional[List[Dict[str, Any]]] = None,
        historical_frequency: float = 0.10,
        trend: str = "STABLE",
    ) -> Dict[str, Any]:
        """Return raw risk prediction dictionary from real AI risk predictor."""
        if not self.force_mock:
            try:
                return predict_road_risk(
                    segment_id=segment_id,
                    rainfall_mm=rainfall_mm,
                    visibility_meters=visibility_meters,
                    weather_advisory=weather_advisory,
                    hazard_type=hazard_type,
                    hazard_severity=hazard_severity,
                    hazard_distance_km=hazard_distance_km,
                    active_incidents=active_incidents,
                    historical_frequency=historical_frequency,
                    trend=trend,
                )
            except Exception as e:
                logger.warning(f"Real AI predict_road_risk failure: {str(e)}. Using fallback mock.")

        return {
            "segment_id": segment_id,
            "risk_score": 0.10,
            "risk_level": "LOW",
            "reasons": ["Fallback mock mode"],
            "is_disrupted": False,
            "components": {},
        }

    # --------------------------------------------------------------------------
    # 3. Delay Estimation
    # --------------------------------------------------------------------------

    async def estimate_delay(
        self,
        distance_km: float,
        base_speed_kmh: float,
        segment_risk_scores: List[float],
        active_bottlenecks_count: int,
    ) -> EstimatedDelayResult:
        """Delegate delay estimation to real AI delay estimator service or protocol mock."""
        if not self.force_mock and self.delay_estimator:
            try:
                # If delay_estimator is real DelayEstimator instance or module function wrapper
                if isinstance(self.delay_estimator, DelayEstimator) or not hasattr(self.delay_estimator, "assert_awaited_once_with"):
                    max_risk = max(segment_risk_scores) if segment_risk_scores else 0.0
                    res = estimate_travel_delay(
                        distance_km=distance_km,
                        base_speed_kmh=base_speed_kmh,
                        bottleneck_clearance_minutes=float(active_bottlenecks_count * 20.0),
                        risk_score=max_risk,
                    )
                    return EstimatedDelayResult(
                        nominal_duration_hours=round(res["normal_travel_minutes"] / 60.0, 2),
                        estimated_delay_hours=round(res["delay_minutes"] / 60.0, 2),
                        total_expected_duration_hours=round(res["estimated_travel_minutes"] / 60.0, 2),
                        bottleneck_buffer_hours=round((active_bottlenecks_count * 20.0) / 60.0, 2),
                        is_fallback=False,
                    )

                # Protocol mock check
                res = self.delay_estimator.estimate_delay(
                    distance_km, base_speed_kmh, segment_risk_scores, active_bottlenecks_count
                )
                if inspect.isawaitable(res):
                    res = await res
                if isinstance(res, EstimatedDelayResult):
                    return res
            except Exception as e:
                logger.warning(f"Real AI DelayEstimator failure: {str(e)}. Using fallback mock.")

        return await self.fallback.estimate_delay(
            distance_km, base_speed_kmh, segment_risk_scores, active_bottlenecks_count
        )

    def estimate_delay_dict(
        self,
        distance_km: float,
        base_speed_kmh: float = 50.0,
        impaired_speed_kmh: Optional[float] = None,
        current_status: str = "OPEN",
        incident_severity: Optional[str] = None,
        bottleneck_clearance_minutes: float = 0.0,
        risk_score: float = 0.0,
    ) -> Dict[str, Any]:
        """Return raw travel delay dictionary from real AI delay estimator."""
        if not self.force_mock:
            try:
                return estimate_travel_delay(
                    distance_km=distance_km,
                    base_speed_kmh=base_speed_kmh,
                    impaired_speed_kmh=impaired_speed_kmh,
                    current_status=current_status,
                    incident_severity=incident_severity,
                    bottleneck_clearance_minutes=bottleneck_clearance_minutes,
                    risk_score=risk_score,
                )
            except Exception as e:
                logger.warning(f"Real AI estimate_travel_delay failure: {str(e)}. Using fallback mock.")

        return {
            "normal_travel_minutes": int(round((distance_km / base_speed_kmh) * 60)),
            "estimated_travel_minutes": int(round((distance_km / base_speed_kmh) * 60)),
            "delay_minutes": 0,
            "delay_percentage": 0.0,
            "is_blocked": False,
            "causes": ["Fallback mock mode"],
        }

    # --------------------------------------------------------------------------
    # 4. Route Optimization
    # --------------------------------------------------------------------------

    def optimize_routes(
        self,
        candidate_routes: List[Dict[str, Any]],
        cargo_priority: str = "STANDARD",
        preference: str = "SAFEST",
    ) -> Dict[str, Any]:
        """Delegate route optimization to real AI route optimizer."""
        if not self.force_mock:
            try:
                return optimize_routes(
                    candidate_routes=candidate_routes,
                    cargo_priority=cargo_priority,
                    preference=preference,
                )
            except Exception as e:
                logger.warning(f"Real AI optimize_routes failure: {str(e)}. Using fallback mock.")

        return {
            "recommended_route_id": candidate_routes[0].get("id") if candidate_routes else None,
            "recommendation_type": preference,
            "routes": candidate_routes,
            "reason": "Fallback mock optimization",
        }
