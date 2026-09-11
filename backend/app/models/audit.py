"""AuditLog model."""

import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from app.database.base import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=True)
    username = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(String(50), nullable=True)
    ip_address = Column(String(50), nullable=True)
    details_raw = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    @property
    def details(self) -> Optional[Dict[str, Any]]:
        if not self.details_raw:
            return None
        try:
            return json.loads(self.details_raw)
        except Exception:
            return None

    @details.setter
    def details(self, value: Any) -> None:
        if value is None:
            self.details_raw = None
        elif isinstance(value, str):
            self.details_raw = value
        else:
            self.details_raw = json.dumps(value)
