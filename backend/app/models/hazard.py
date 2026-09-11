"""Hazard model for regional hazard hotspots."""

from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from app.database.base import Base


import uuid

class Hazard(Base):
    __tablename__ = "hazards"

    id = Column(String(50), primary_key=True, index=True, default=lambda: f"haz-{uuid.uuid4().hex[:8]}")
    name = Column(String(150), nullable=True)
    hazard_type = Column(String(50), nullable=False, index=True)  # LANDSLIDE_ZONE, FLOOD_PRONE, AVALANCHE_ZONE
    severity = Column(String(20), default="HIGH", nullable=False)
    state = Column(String(50), nullable=True, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_km = Column(Float, default=5.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
