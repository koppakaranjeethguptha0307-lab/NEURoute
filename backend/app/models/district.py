"""District model."""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.orm import relationship
from app.database.base import Base


class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    state = Column(String(50), nullable=False, index=True)
    headquarters = Column(String(100), nullable=True)
    accessibility_score = Column(Float, default=1.0, nullable=False)
    total_road_km = Column(Float, default=0.0, nullable=False)
    blocked_road_km = Column(Float, default=0.0, nullable=False)
    active_incidents_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    road_segments = relationship("RoadSegment", back_populates="district")
    hubs = relationship("LogisticsHub", back_populates="district")
