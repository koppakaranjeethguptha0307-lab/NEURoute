"""Audit log schemas."""

from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class AuditLogBase(BaseModel):
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str = Field(..., description="Action name e.g. AUTH_LOGIN, INCIDENT_STATUS_CHANGE, SHIPMENT_ASSIGN")
    entity_type: str = Field(..., description="Target entity type e.g. Incident, Shipment, Vehicle, User")
    entity_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class AuditLogCreate(AuditLogBase):
    pass


class AuditLogResponse(AuditLogBase):
    id: int
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)
