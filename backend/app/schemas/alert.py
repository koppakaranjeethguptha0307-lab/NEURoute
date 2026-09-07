"""Alert and notification schemas."""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.enums import AlertSeverity


class AlertBase(BaseModel):
    title: str = Field(..., max_length=200)
    message: str
    severity: AlertSeverity = AlertSeverity.INFORMATIONAL
    category: str = Field(default="OPERATIONAL", description="Alert domain: ROAD_DISRUPTION | WEATHER | VEHICLE_DELAY | REROUTING")
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    metadata_json: Optional[Dict[str, Any]] = None


class AlertCreate(AlertBase):
    pass


class AlertResponse(AlertBase):
    id: int
    is_read: bool = False
    is_acknowledged: bool = False
    acknowledged_by_user_id: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AlertFilter(BaseModel):
    severity: Optional[AlertSeverity] = None
    category: Optional[str] = None
    is_read: Optional[bool] = None
    is_acknowledged: Optional[bool] = None
