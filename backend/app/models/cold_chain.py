"""ColdChainTelemetry model."""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from app.database.base import Base


class ColdChainTelemetry(Base):
    __tablename__ = "cold_chain_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(String(50), ForeignKey("shipments.id"), nullable=False, index=True)
    vehicle_id = Column(String(50), ForeignKey("vehicles.id"), nullable=True)
    temperature_c = Column(Float, nullable=False)
    humidity_percent = Column(Float, default=65.0, nullable=False)
    status = Column(String(20), default="NORMAL", nullable=False)  # NORMAL, WARNING, CRITICAL
    source = Column(String(30), default="SIMULATED_TELEMETRY", nullable=False)
    ambient_temp_c = Column(Float, default=28.0, nullable=False)
    location_lat = Column(Float, nullable=True)
    location_lng = Column(Float, nullable=True)
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
