from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Float, Integer, String, Text, Boolean
from app.database.session import Base


class GovernmentAdvisory(Base):
    """
    Government Coordination Advisory Model.
    Represents digital road closures, disaster advisories, police checkpoints,
    and emergency corridors issued by regional emergency management authorities.
    """

    __tablename__ = "government_advisories"

    id = Column(Integer, primary_key=True, index=True)
    advisory_code = Column(String(50), unique=True, index=True, nullable=False)
    agency = Column(String(150), nullable=False, default="Regional Emergency Coordination Cell")
    district = Column(String(100), nullable=False, default="Dima Hasao")
    road = Column(String(100), nullable=False, default="NH-06")
    latitude = Column(Float, nullable=False, default=25.1120)
    longitude = Column(Float, nullable=False, default=92.3680)
    status = Column(String(50), nullable=False, default="ACTIVE") # ACTIVE, RESTRICTED, RESOLVED
    severity = Column(String(50), nullable=False, default="CRITICAL") # LOW, MODERATE, HIGH, CRITICAL
    start_time = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime, nullable=True)
    reason = Column(Text, nullable=False, default="Landslide clearance operation near Sonapur Tunnel")
    vehicle_restriction = Column(String(100), nullable=False, default="RESTRICTED_HEAVY_TRUCKS")
    emergency_override = Column(Boolean, nullable=False, default=True) # Medical priority access allowed
    source = Column(String(100), nullable=False, default="SOFTWARE GOVERNMENT ADVISORY SIMULATOR")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
