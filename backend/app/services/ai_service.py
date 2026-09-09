"""
AI Service governing business logic and database persistence for AI predictions.
Routes calls via AIIntegrationAdapter to ensure modular adapter architecture.
"""

import json
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.adapters.ai.ai_adapter import AIIntegrationAdapter
from app.core.logging import logger
from app.models.prediction import Prediction
from app.repositories.prediction_repository import PredictionRepository


class AIService:
    """Business service governing AI predictions, adapter delegation, and DB persistence."""

    def __init__(
        self,
        db: Session,
        ai_adapter: Optional[AIIntegrationAdapter] = None,
        prediction_repo: Optional[PredictionRepository] = None,
    ) -> None:
        self.db = db
        self.ai_adapter = ai_adapter or AIIntegrationAdapter()
        self.prediction_repo = prediction_repo or PredictionRepository(db)

    def classify_incident_text(self, text: str) -> Dict[str, Any]:
        """Classify incident text via AIIntegrationAdapter, persist prediction record to DB, and return result."""
        result = self.ai_adapter.classify_incident_dict(text)
        
        # Persist prediction to database
        try:
            self.prediction_repo.create_prediction(
                prediction_type="INCIDENT_CLASSIFICATION",
                target_entity_type="INCIDENT",
                target_entity_id="incident_text_query",
                predicted_value=json.dumps(result),
                confidence=result.get("confidence", 1.0),
                model_version="v1.0.0-rule-heuristic",
                input_features=json.dumps({"text": text}),
                method="RULE_HEURISTIC",
                risk_level=result.get("severity", "LOW"),
            )
        except Exception as e:
            logger.warning(f"Failed to persist incident classification prediction: {str(e)}")

        return result

    def predict_risk(
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
        """Calculate segment risk score via AIIntegrationAdapter, persist prediction record to DB, and return result."""
        result = self.ai_adapter.predict_risk_dict(
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

        # Parse numeric segment_id if integer
        int_seg_id = None
        if isinstance(segment_id, int) or (isinstance(segment_id, str) and segment_id.isdigit()):
            int_seg_id = int(segment_id)

        # Persist prediction to database
        try:
            self.prediction_repo.create_prediction(
                prediction_type="RISK_SCORE",
                target_entity_type="ROAD_SEGMENT",
                target_entity_id=str(segment_id),
                predicted_value=str(result.get("risk_score", 0.0)),
                confidence=0.90,
                model_version="v1.0.0-scoring-baseline",
                input_features=json.dumps(result.get("components", {})),
                method="MULTI_FACTOR_WEIGHTED",
                segment_id=int_seg_id,
                risk_score=result.get("risk_score", 0.0),
                risk_level=result.get("risk_level", "LOW"),
                rainfall_factor=result.get("components", {}).get("weather_norm", 0.0),
                incident_factor=result.get("components", {}).get("incident_active", 0.0),
                terrain_factor=result.get("components", {}).get("hazard_prox", 0.0),
                recommendations_raw=json.dumps(result.get("reasons", [])),
            )
        except Exception as e:
            logger.warning(f"Failed to persist risk prediction: {str(e)}")

        return result

    def estimate_delay(
        self,
        distance_km: float,
        base_speed_kmh: float = 50.0,
        impaired_speed_kmh: Optional[float] = None,
        current_status: str = "OPEN",
        incident_severity: Optional[str] = None,
        bottleneck_clearance_minutes: float = 0.0,
        risk_score: float = 0.0,
    ) -> Dict[str, Any]:
        """Estimate travel delay via AIIntegrationAdapter, persist prediction record to DB, and return result."""
        result = self.ai_adapter.estimate_delay_dict(
            distance_km=distance_km,
            base_speed_kmh=base_speed_kmh,
            impaired_speed_kmh=impaired_speed_kmh,
            current_status=current_status,
            incident_severity=incident_severity,
            bottleneck_clearance_minutes=bottleneck_clearance_minutes,
            risk_score=risk_score,
        )

        # Persist prediction to database
        try:
            self.prediction_repo.create_prediction(
                prediction_type="DELAY_MINUTES",
                target_entity_type="TRIP",
                target_entity_id="trip_delay_query",
                predicted_value=str(result.get("delay_minutes", 0)),
                confidence=0.85,
                model_version="v1.0.0-kinematic-bottleneck",
                input_features=json.dumps({
                    "normal_min": result.get("normal_travel_minutes"),
                    "est_min": result.get("estimated_travel_minutes"),
                }),
                method="KINEMATIC_CLEARANCE_HEURISTIC",
                risk_score=risk_score,
                recommendations_raw=json.dumps(result.get("causes", [])),
            )
        except Exception as e:
            logger.warning(f"Failed to persist delay estimation prediction: {str(e)}")

        return result

    def optimize_routes(
        self,
        candidate_routes: List[Dict[str, Any]],
        cargo_priority: str = "STANDARD",
        preference: str = "SAFEST",
    ) -> Dict[str, Any]:
        """Optimize route selection via AIIntegrationAdapter, persist prediction record to DB, and return result."""
        result = self.ai_adapter.optimize_routes(
            candidate_routes=candidate_routes,
            cargo_priority=cargo_priority,
            preference=preference,
        )

        # Persist prediction to database
        try:
            rec_id = result.get("recommended_route_id", "route_optimization")
            self.prediction_repo.create_prediction(
                prediction_type="ROUTE_OPTIMIZATION",
                target_entity_type="ROUTE",
                target_entity_id=str(rec_id),
                predicted_value=result.get("recommendation_type", "SAFEST"),
                confidence=0.95,
                model_version="v1.0.0-multi-criteria",
                input_features=json.dumps({"cargo_priority": cargo_priority, "preference": preference}),
                method="MULTI_CRITERIA_COST",
                recommendations_raw=json.dumps([result.get("reason", "")]),
            )
        except Exception as e:
            logger.warning(f"Failed to persist route optimization prediction: {str(e)}")

        return result

    def get_predictions(self, limit: int = 50) -> List[Prediction]:
        """Fetch all stored prediction records from database."""
        return self.prediction_repo.get_all(limit=limit)
