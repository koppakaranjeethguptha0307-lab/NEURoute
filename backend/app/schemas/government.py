from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class GovernmentAdvisoryBase(BaseModel):
    agency: str = Field(default="Regional Emergency Coordination Cell")
    district: str = Field(default="Dima Hasao")
    road: str = Field(default="NH-06 Sonapur Sector")
    latitude: float = Field(default=25.1120, ge=-90.0, le=90.0)
    longitude: float = Field(default=92.3680, ge=-180.0, le=180.0)
    status: str = Field(default="ACTIVE", description="ACTIVE, RESTRICTED, RESOLVED")
    severity: str = Field(default="CRITICAL", description="LOW, MODERATE, HIGH, CRITICAL")
    reason: str = Field(default="Landslide clearance operation")
    vehicle_restriction: str = Field(default="RESTRICTED_HEAVY_TRUCKS")
    emergency_override: bool = Field(default=True, description="Medical & relief priority access allowed")
    source: str = Field(default="SOFTWARE GOVERNMENT ADVISORY SIMULATOR")


class GovernmentAdvisoryCreate(GovernmentAdvisoryBase):
    advisory_code: Optional[str] = None


class GovernmentAdvisoryResponse(GovernmentAdvisoryBase):
    id: int
    advisory_code: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
