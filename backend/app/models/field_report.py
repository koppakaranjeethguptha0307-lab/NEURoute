"""FieldReport model for offline mobile synchronization."""

import json
from datetime import datetime, timezone
from typing import Any, List
from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from app.database.base import Base


class FieldReport(Base):
    __tablename__ = "field_reports"

    id = Column(Integer, primary_key=True, index=True)
    client_report_uuid = Column(String(100), unique=True, nullable=False, index=True)
    title = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    captured_at = Column(DateTime, nullable=False)
    synced_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    photos_raw = Column(Text, nullable=True)
    status = Column(String(20), default="SYNCED", nullable=False)

    @property
    def photos(self) -> List[str]:
        if not self.photos_raw:
            return []
        try:
            return json.loads(self.photos_raw)
        except Exception:
            return []

    @photos.setter
    def photos(self, value: Any) -> None:
        if isinstance(value, str):
            self.photos_raw = value
        else:
            self.photos_raw = json.dumps(value)
