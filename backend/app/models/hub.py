"""LogisticsHub model."""

from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database.base import Base


class LogisticsHub(Base):
    __tablename__ = "logistics_hubs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    hub_type = Column(String(50), default="WAREHOUSE", nullable=False)  # CENTRAL_DEPOT, FORWARD_DEPOT, EMERGENCY_SUPPLY_DEPOT
    state = Column(String(50), nullable=False, index=True)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity_tonnes = Column(Float, default=100.0, nullable=False)
    is_emergency_depot = Column(Boolean, default=False, nullable=False)
    contact_phone = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    district = relationship("District", back_populates="hubs")
    vehicles = relationship("Vehicle", back_populates="assigned_hub")
