"""RoadSegment model."""

import json
from datetime import datetime, timezone
from typing import Any, List
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database.base import Base


import uuid

class RoadSegment(Base):
    __tablename__ = "road_segments"

    id = Column(String(50), primary_key=True, index=True, default=lambda: f"seg-{uuid.uuid4().hex[:8]}")
    segment_code = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    highway_number = Column(String(50), nullable=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    start_lat = Column(Float, nullable=False)
    start_lng = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lng = Column(Float, nullable=False)
    length_km = Column(Float, default=0.0, nullable=False)
    elevation_gain_m = Column(Float, default=0.0, nullable=False)
    is_critical_lifeline = Column(Boolean, default=True, nullable=False)
    current_status = Column(String(20), default="OPEN", nullable=False, index=True)  # OPEN, RISKY, BLOCKED, UNKNOWN
    risk_score = Column(Float, default=0.0, nullable=False)
    speed_limit_kmh = Column(Float, default=40.0, nullable=False)
    coordinates_geojson = Column(Text, nullable=True)  # GeoJSON serialized coordinates [[lng, lat], ...]
    coordinates_raw = Column(Text, nullable=True)  # JSON serialized coordinates [[lat, lng], ...]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    district = relationship("District", back_populates="road_segments")
    incidents = relationship("Incident", back_populates="road_segment")
    predictions = relationship("Prediction", back_populates="road_segment")

    @property
    def coordinates(self) -> List[List[float]]:
        raw = self.coordinates_geojson or self.coordinates_raw
        if not raw:
            return [[self.start_lat, self.start_lng], [self.end_lat, self.end_lng]]
        try:
            pts = json.loads(raw)
            if pts and len(pts[0]) >= 2:
                # If stored as GeoJSON [lng, lat] (lng ~ 92 vs lat ~ 25 in NER), return normalized [lat, lng]
                if pts[0][0] > pts[0][1]:
                    return [[p[1], p[0]] for p in pts]
                return pts
            return pts
        except Exception:
            return [[self.start_lat, self.start_lng], [self.end_lat, self.end_lng]]

    @coordinates.setter
    def coordinates(self, value: Any) -> None:
        if isinstance(value, str):
            self.coordinates_raw = value
        else:
            self.coordinates_raw = json.dumps(value)
