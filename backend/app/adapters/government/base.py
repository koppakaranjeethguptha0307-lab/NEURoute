"""
NEURoute — Software-Only Government Integration Provider.
Standardized software contracts for:
- road closure notices
- disaster alerts (NDMA / SDMA format)
- transport information
- incident information
- emergency corridor information
- checkpoint clearance status
Guarantees transparent data source disclosure: LIVE | SIMULATED | NOT_CONFIGURED.
"""

from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional, Protocol, runtime_checkable
from pydantic import BaseModel, Field


class GovernmentSource(str, Enum):
    LIVE_API = "LIVE_API"
    SIMULATED = "SIMULATED"
    NOT_CONFIGURED = "NOT_CONFIGURED"


class NoticeSeverity(str, Enum):
    INFO = "INFO"
    ADVISORY = "ADVISORY"
    WARNING = "WARNING"
    EMERGENCY = "EMERGENCY"


class GovernmentAdvisory(BaseModel):
    id: str
    agency_name: str
    state: str
    category: str  # ROAD_CLOSURE, DISASTER_ALERT, EMERGENCY_CORRIDOR, CHECKPOINT_CLEARANCE
    severity: NoticeSeverity = NoticeSeverity.ADVISORY
    headline: str
    description: str
    affected_corridors: List[str] = Field(default_factory=list)
    is_active: bool = True
    source: GovernmentSource = GovernmentSource.SIMULATED
    verified_official: bool = False
    issued_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None


@runtime_checkable
class GovernmentIntegrationProtocol(Protocol):
    """Protocol defining standardized contracts for government regulatory and disaster feeds."""

    async def get_active_advisories(self, state: Optional[str] = None) -> List[GovernmentAdvisory]:
        """Fetch active road closure, disaster, and transport advisories."""
        ...

    async def get_corridor_status(self, corridor_code: str) -> Optional[GovernmentAdvisory]:
        """Fetch regulatory clearance or restriction for a specific highway lifeline."""
        ...
