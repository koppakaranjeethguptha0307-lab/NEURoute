import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from app.database.base import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(50), primary_key=True, index=True, default=lambda: f"alt-ner-{uuid.uuid4().hex[:8]}")
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="INFORMATIONAL", nullable=False, index=True)  # INFORMATIONAL, WARNING, CRITICAL
    category = Column(String(50), default="OPERATIONAL", nullable=False, index=True)  # ROAD_DISRUPTION, WEATHER, VEHICLE_DELAY, REROUTING
    entity_type = Column(String(50), nullable=True)  # Incident, Shipment, Vehicle, RoadSegment
    entity_id = Column(String(50), nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    is_acknowledged = Column(Boolean, default=False, nullable=False, index=True)
    acknowledged_by_user_id = Column(String(50), ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    metadata_raw = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    @property
    def metadata_json(self) -> Optional[Dict[str, Any]]:
        if not self.metadata_raw:
            return None
        try:
            return json.loads(self.metadata_raw)
        except Exception:
            return None

    @metadata_json.setter
    def metadata_json(self, value: Any) -> None:
        if value is None:
            self.metadata_raw = None
        elif isinstance(value, str):
            self.metadata_raw = value
        else:
            self.metadata_raw = json.dumps(value)
