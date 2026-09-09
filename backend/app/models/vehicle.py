"""Vehicle model."""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database.base import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String(50), unique=True, nullable=False, index=True)
    vehicle_type = Column(String(50), default="Heavy Truck", nullable=False)
    capacity_kg = Column(Float, default=5000.0, nullable=False)
    driver_name = Column(String(100), nullable=True)
    driver_phone = Column(String(20), nullable=True)
    status = Column(String(20), default="AVAILABLE", nullable=False, index=True)  # AVAILABLE, ASSIGNED, IN_TRANSIT, MAINTENANCE, OFFLINE
    assigned_hub_id = Column(Integer, ForeignKey("logistics_hubs.id"), nullable=True)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    speed_kmh = Column(Float, default=0.0, nullable=True)
    heading_deg = Column(Float, default=0.0, nullable=True)
    fuel_level_percent = Column(Float, default=100.0, nullable=False)
    last_telemetry_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    assigned_hub = relationship("LogisticsHub", back_populates="vehicles")
    shipments = relationship("Shipment", back_populates="assigned_vehicle")
    trips = relationship("Trip", back_populates="vehicle")
