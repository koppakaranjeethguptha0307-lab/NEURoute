"""Access Request model for onboarding operational accounts."""

from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, String
from app.database.base import Base


class AccessRequest(Base):
    __tablename__ = "access_requests"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False, index=True)
    organization = Column(String(100), nullable=False)
    requested_role = Column(String(50), nullable=False)
    phone_number = Column(String(20), nullable=True)
    reason = Column(String(255), nullable=True)
    status = Column(String(20), default="PENDING", nullable=False) # PENDING, APPROVED, REJECTED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
