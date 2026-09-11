"""Prediction model for explainable AI risk scoring."""

import json
from datetime import datetime, timezone
from typing import Any, List
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database.base import Base


import uuid

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String(50), primary_key=True, index=True, default=lambda: f"pred-{uuid.uuid4().hex[:8]}")
    segment_id = Column(String(50), ForeignKey("road_segments.id"), nullable=True)
    prediction_type = Column(String(50), nullable=True, default="RISK_SCORE")
    target_entity_type = Column(String(50), nullable=True, default="ROAD_SEGMENT")
    target_entity_id = Column(String(50), nullable=True)
    predicted_value = Column(Text, nullable=True)
    confidence = Column(Float, default=1.0, nullable=False)
    model_version = Column(String(50), default="v1.0.0", nullable=False)
    input_features = Column(Text, nullable=True)
    method = Column(String(100), default="RULE_HEURISTIC", nullable=False)
    risk_score = Column(Float, default=0.0, nullable=False)
    risk_level = Column(String(20), default="LOW", nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    rainfall_factor = Column(Float, default=0.0, nullable=False)
    incident_factor = Column(Float, default=0.0, nullable=False)
    terrain_factor = Column(Float, default=0.0, nullable=False)
    recommendations_raw = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    road_segment = relationship("RoadSegment", back_populates="predictions")


    @property
    def recommendations(self) -> List[str]:
        if not self.recommendations_raw:
            return []
        try:
            return json.loads(self.recommendations_raw)
        except Exception:
            return []

    @recommendations.setter
    def recommendations(self, value: Any) -> None:
        if isinstance(value, str):
            self.recommendations_raw = value
        else:
            self.recommendations_raw = json.dumps(value)
