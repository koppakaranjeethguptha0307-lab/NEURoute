"""Route and RouteSegmentMapping models."""

import json
from datetime import datetime, timezone
from typing import Any, List
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from app.database.base import Base


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lng = Column(Float, nullable=False)
    distance_km = Column(Float, default=0.0, nullable=False)
    estimated_duration_hours = Column(Float, default=0.0, nullable=False)
    criterion = Column(String(50), default="SAFEST", nullable=False)  # SAFEST, FASTEST, PRIORITY
    safety_score = Column(Float, default=1.0, nullable=False)
    geometry_raw = Column(Text, nullable=True)  # JSON coordinates
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    @property
    def geometry(self) -> List[List[float]]:
        if not self.geometry_raw:
            return [[self.origin_lat, self.origin_lng], [self.destination_lat, self.destination_lng]]
        try:
            return json.loads(self.geometry_raw)
        except Exception:
            return [[self.origin_lat, self.origin_lng], [self.destination_lat, self.destination_lng]]

    @geometry.setter
    def geometry(self, value: Any) -> None:
        if isinstance(value, str):
            self.geometry_raw = value
        else:
            self.geometry_raw = json.dumps(value)


class RouteSegmentMapping(Base):
    __tablename__ = "route_segment_mappings"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    segment_id = Column(Integer, ForeignKey("road_segments.id"), nullable=False)
    sequence_order = Column(Integer, default=0, nullable=False)
