from datetime import datetime
from typing import Any, Dict, Optional, Union
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.schemas.enums import AlertSeverity


class AlertBase(BaseModel):
    title: str = Field(..., max_length=200)
    message: str
    severity: AlertSeverity = AlertSeverity.INFORMATIONAL
    category: str = Field(default="OPERATIONAL", description="Alert domain: ROAD_DISRUPTION | WEATHER | VEHICLE_DELAY | REROUTING")
    entity_type: Optional[str] = None
    entity_id: Optional[Union[str, int]] = None
    metadata_json: Optional[Dict[str, Any]] = None


class AlertCreate(AlertBase):
    pass


class AlertResponse(AlertBase):
    id: Union[str, int]
    is_read: bool = False
    is_acknowledged: bool = False
    acknowledged_by_user_id: Optional[Union[str, int]] = None
    acknowledged_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    # Dual-case compatibility fields for frontend clients
    read: bool = False
    timestamp: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="after")
    def populate_dual_case(self) -> "AlertResponse":
        self.read = self.is_read
        if not self.timestamp and self.created_at:
            self.timestamp = self.created_at.isoformat()
        return self


class AlertFilter(BaseModel):
    severity: Optional[AlertSeverity] = None
    category: Optional[str] = None
    is_read: Optional[bool] = None
    is_acknowledged: Optional[bool] = None

