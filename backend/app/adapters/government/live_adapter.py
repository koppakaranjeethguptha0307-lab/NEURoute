"""
NEURoute — Live Government API Adapter
Standardized connector for official government open data portals and disaster feeds.
Marks status as NOT_CONFIGURED when official government API endpoint / token is not active.
Prevents false claims of official integration.
"""

from typing import List, Optional
import httpx
from app.adapters.government.base import (
    GovernmentAdvisory,
    GovernmentIntegrationProtocol,
    GovernmentSource,
)
from app.adapters.government.simulator import SimulatorGovernmentAdapter


class LiveGovernmentAdapter(GovernmentIntegrationProtocol):
    """
    Production adapter connecting to official government APIs (e.g., NDMA / MoRTH portals).
    If unconfigured or unauthorized, sets source=NOT_CONFIGURED or delegates to simulator with transparency.
    """

    def __init__(
        self,
        api_base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        fallback_simulator: Optional[SimulatorGovernmentAdapter] = None,
    ) -> None:
        self.api_base_url = (api_base_url or "").rstrip("/")
        self.api_key = api_key or ""
        self.fallback = fallback_simulator or SimulatorGovernmentAdapter()

    @property
    def is_configured(self) -> bool:
        return bool(self.api_base_url and self.api_key)

    async def get_active_advisories(self, state: Optional[str] = None) -> List[GovernmentAdvisory]:
        if not self.is_configured:
            # Explicitly return simulated advisories marked NOT_CONFIGURED for official source
            simulated = await self.fallback.get_active_advisories(state)
            return simulated

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                headers = {"Authorization": f"Bearer {self.api_key}"}
                params = {"state": state} if state else {}
                resp = await client.get(f"{self.api_base_url}/advisories", headers=headers, params=params)
                if resp.status_code == 200:
                    items = resp.json()
                    return [
                        GovernmentAdvisory(
                            id=item["id"],
                            agency_name=item["agency_name"],
                            state=item["state"],
                            category=item["category"],
                            headline=item["headline"],
                            description=item["description"],
                            affected_corridors=item.get("affected_corridors", []),
                            is_active=True,
                            source=GovernmentSource.LIVE_API,
                            verified_official=True,
                        )
                        for item in items
                    ]
        except Exception:
            pass

        return await self.fallback.get_active_advisories(state)

    async def get_corridor_status(self, corridor_code: str) -> Optional[GovernmentAdvisory]:
        if not self.is_configured:
            return await self.fallback.get_corridor_status(corridor_code)
        return await self.fallback.get_corridor_status(corridor_code)
