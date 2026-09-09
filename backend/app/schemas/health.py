"""System health and readiness schemas."""

from typing import Dict, Optional
from pydantic import BaseModel


class ComponentHealth(BaseModel):
    status: str  # "healthy" | "degraded" | "unhealthy"
    message: Optional[str] = None
    response_time_ms: Optional[float] = None
    details: Optional[Dict[str, str]] = None


class HealthCheckResponse(BaseModel):
    status: str  # "healthy" | "degraded" | "unhealthy"
    version: str
    environment: str
    mock_mode: bool
    components: Dict[str, ComponentHealth]
