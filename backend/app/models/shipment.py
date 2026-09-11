"""Shipment model with cold-chain monitoring attributes."""

from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.database.base import Base


import uuid

class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(String(50), primary_key=True, index=True, default=lambda: f"shp-{uuid.uuid4().hex[:8]}")
    tracking_number = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    cargo_type = Column(String(100), nullable=False)  # Medical Supplies, Relief Material, Rations, Fuel, etc.
    cargo_priority = Column(String(20), default="NORMAL", nullable=False, index=True)  # LOW, NORMAL, HIGH, CRITICAL
    weight_kg = Column(Float, default=0.0, nullable=False)
    origin_hub_id = Column(String(50), ForeignKey("logistics_hubs.id"), nullable=True)
    origin_address = Column(String(255), nullable=False)
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    destination_hub_id = Column(String(50), ForeignKey("logistics_hubs.id"), nullable=True)
    destination_address = Column(String(255), nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lng = Column(Float, nullable=False)
    assigned_vehicle_id = Column(String(50), ForeignKey("vehicles.id"), nullable=True)
    status = Column(String(20), default="CREATED", nullable=False, index=True)  # CREATED, ASSIGNED, IN_TRANSIT, DELIVERED, CANCELLED
    dispatched_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    estimated_delivery = Column(DateTime, nullable=True)
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    # Cold-Chain Monitoring Attributes (Software-governed)
    is_cold_chain = Column(Boolean, default=False, nullable=False)
    temp_min_c = Column(Float, default=2.0, nullable=True)
    temp_max_c = Column(Float, default=8.0, nullable=True)
    current_temp_c = Column(Float, nullable=True)
    temp_status = Column(String(20), default="NORMAL", nullable=True)  # NORMAL, WARNING, CRITICAL

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    assigned_vehicle = relationship("Vehicle", back_populates="shipments")
