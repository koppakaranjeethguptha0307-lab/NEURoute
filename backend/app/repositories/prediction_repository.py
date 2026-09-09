"""Prediction repository for managing AI prediction persistence."""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.prediction import Prediction
from app.repositories.base import BaseRepository


class PredictionRepository(BaseRepository[Prediction]):
    """Repository handling CRUD operations for AI Predictions."""

    def __init__(self, db: Session) -> None:
        super().__init__(Prediction, db)

    def create_prediction(
        self,
        prediction_type: str,
        target_entity_type: str,
        target_entity_id: str,
        predicted_value: str,
        confidence: float = 1.0,
        model_version: str = "v1.0.0",
        input_features: Optional[str] = None,
        method: str = "RULE_HEURISTIC",
        segment_id: Optional[int] = None,
        risk_score: float = 0.0,
        risk_level: str = "LOW",
        rainfall_factor: float = 0.0,
        incident_factor: float = 0.0,
        terrain_factor: float = 0.0,
        recommendations_raw: Optional[str] = None,
    ) -> Prediction:
        """Create and persist an AI prediction record."""
        prediction = Prediction(
            prediction_type=prediction_type,
            target_entity_type=target_entity_type,
            target_entity_id=str(target_entity_id),
            predicted_value=predicted_value,
            confidence=confidence,
            model_version=model_version,
            input_features=input_features,
            method=method,
            segment_id=segment_id,
            risk_score=risk_score,
            risk_level=risk_level,
            rainfall_factor=rainfall_factor,
            incident_factor=incident_factor,
            terrain_factor=terrain_factor,
            recommendations_raw=recommendations_raw,
        )
        self.db.add(prediction)
        self.db.commit()
        self.db.refresh(prediction)
        return prediction

    def get_by_target(self, target_entity_type: str, target_entity_id: str) -> List[Prediction]:
        """Fetch all prediction records for a target entity."""
        return (
            self.db.query(Prediction)
            .filter(
                Prediction.target_entity_type == target_entity_type,
                Prediction.target_entity_id == str(target_entity_id),
            )
            .order_by(Prediction.created_at.desc())
            .all()
        )

    def get_latest_by_segment(self, segment_id: int) -> Optional[Prediction]:
        """Fetch the most recent risk prediction for a road segment."""
        return (
            self.db.query(Prediction)
            .filter(Prediction.segment_id == segment_id)
            .order_by(Prediction.created_at.desc())
            .first()
        )
