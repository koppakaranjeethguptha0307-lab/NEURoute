"""WeatherObservation model."""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, Integer, String
from app.database.base import Base


class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String(100), nullable=False, index=True)
    state = Column(String(50), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    temperature_c = Column(Float, nullable=False)
    rainfall_mm = Column(Float, default=0.0, nullable=False)
    wind_speed_kmh = Column(Float, default=0.0, nullable=False)
    visibility_km = Column(Float, default=10.0, nullable=False)
    condition = Column(String(50), default="CLEAR", nullable=False)
    observed_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
