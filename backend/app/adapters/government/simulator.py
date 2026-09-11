"""
NEURoute — Simulated Government Integration Adapter
Produces standardized regulatory and disaster advisories for SIH demonstration.
Explicitly identifies data source as SIMULATED (verified_official=False).
"""

from datetime import datetime, timezone
from typing import List, Optional
from app.adapters.government.base import (
    GovernmentAdvisory,
    GovernmentIntegrationProtocol,
    GovernmentSource,
    NoticeSeverity,
)


class SimulatorGovernmentAdapter(GovernmentIntegrationProtocol):
    """
    Simulated government intelligence adapter.
    Models official notification formats (NDMA, Assam SDMA, Meghalaya PWD) in pure software.
    """

    def __init__(self) -> None:
        self._advisories: List[GovernmentAdvisory] = [
            GovernmentAdvisory(
                id="GOV-ADV-2026-001",
                agency_name="State Disaster Management Authority (Meghalaya SDMA)",
                state="Meghalaya",
                category="ROAD_CLOSURE",
                severity=NoticeSeverity.EMERGENCY,
                headline="NH-06 Sonapur Tunnel Valley Sector Emergency Closure Order",
                description="Heavy continuous slope precipitation exceeding 90mm has triggered rockfall between km 41 and 44. Traffic halted. Priority corridor clearance requested for SDRF and critical medical supply convoys.",
                affected_corridors=["NH-06", "seg-nh06-03"],
                is_active=True,
                source=GovernmentSource.SIMULATED,
                verified_official=False,
                issued_at=datetime.now(timezone.utc),
            ),
            GovernmentAdvisory(
                id="GOV-ADV-2026-002",
                agency_name="North Eastern Regional Transport & Logistics Coordination Cell",
                state="Assam",
                category="EMERGENCY_CORRIDOR",
                severity=NoticeSeverity.WARNING,
                headline="Umrangso Lifeline Arterial Designated as Priority Relief Bypass",
                description="All commercial heavy freight diverted via NH-27 / NH-627 (Umrangso - Halflong). Essential cold-chain and medical transports expedited with zero toll hindrance.",
                affected_corridors=["NH-27", "NH-627", "seg-umr-01"],
                is_active=True,
                source=GovernmentSource.SIMULATED,
                verified_official=False,
                issued_at=datetime.now(timezone.utc),
            ),
        ]

    async def get_active_advisories(self, state: Optional[str] = None) -> List[GovernmentAdvisory]:
        if state and state.lower() != "all states":
            return [a for a in self._advisories if a.is_active and a.state.lower() == state.lower()]
        return [a for a in self._advisories if a.is_active]

    async def get_corridor_status(self, corridor_code: str) -> Optional[GovernmentAdvisory]:
        for adv in self._advisories:
            if adv.is_active and any(corridor_code.lower() in c.lower() for c in adv.affected_corridors):
                return adv
        return None

    def add_simulated_advisory(self, advisory: GovernmentAdvisory) -> None:
        advisory.source = GovernmentSource.SIMULATED
        advisory.verified_official = False
        self._advisories.insert(0, advisory)
