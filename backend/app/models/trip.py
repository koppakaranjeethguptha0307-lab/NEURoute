"""Trip model."""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database.base import Base


import uuid

class Trip(Base):
    __tablename__ = "trips"

    id = Column(String(50), primary_key=True, index=True, default=lambda: f"trip-{uuid.uuid4().hex[:8]}")
    trip_code = Column(String(50), unique=True, nullable=True, index=True)
    vehicle_id = Column(String(50), ForeignKey("vehicles.id"), nullable=False)
    driver_name = Column(String(100), nullable=True)
    status = Column(String(20), default="PLANNED", nullable=False)  # PLANNED, ACTIVE, COMPLETED, CANCELLED
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    dest_lat = Column(Float, nullable=False)
    dest_lng = Column(Float, nullable=False)
    distance_km = Column(Float, default=0.0, nullable=False)
    duration_hours = Column(Float, default=0.0, nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    vehicle = relationship("Vehicle", back_populates="trips")
