import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database.base import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(50), primary_key=True, index=True, default=lambda: f"inc-ner-{uuid.uuid4().hex[:8]}")
    field_report_id = Column(String(50), ForeignKey("field_reports.id"), nullable=True)
    title = Column(String(200), nullable=True)
    category = Column(String(50), nullable=False, index=True)  # LANDSLIDE, FLOOD, ROAD_DAMAGE, etc.
    severity = Column(String(20), default="MEDIUM", nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    status = Column(String(20), default="REPORTED", nullable=False, index=True)  # REPORTED, INVESTIGATING, CONFIRMED, ACTIVE, RESOLVED
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    road_segment_id = Column(String(50), ForeignKey("road_segments.id"), nullable=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    blocked_lanes = Column(Integer, default=1, nullable=False)
    passable_by_heavy_vehicles = Column(Boolean, default=True, nullable=False)
    estimated_clearance_hours = Column(Float, nullable=True)
    reported_by_user_id = Column(String(50), ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    reported_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    road_segment = relationship("RoadSegment", back_populates="incidents")
