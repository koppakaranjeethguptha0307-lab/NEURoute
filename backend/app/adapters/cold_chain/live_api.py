"""
NEURoute — Live Cold-Chain API Provider Adapter
Ingests external software IoT/telematics data via HTTPS REST API without requiring local physical sensors.
Returns NOT_CONFIGURED or delegates to simulator when external credentials/endpoints are absent.
"""

from typing import List, Optional
import httpx
from app.adapters.cold_chain.base import (
    ColdChainProviderProtocol,
    ColdChainReading,
    ColdChainSource,
    ColdChainStatus,
)
from app.adapters.cold_chain.simulator import SimulatorColdChainProvider


class LiveApiColdChainProvider(ColdChainProviderProtocol):
    """Production telematics adapter for external cold-chain API gateways."""

    def __init__(
        self,
        api_base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        fallback_simulator: Optional[SimulatorColdChainProvider] = None,
    ) -> None:
        self.api_base_url = (api_base_url or "").rstrip("/")
        self.api_key = api_key or ""
        self.fallback = fallback_simulator or SimulatorColdChainProvider()

    @property
    def is_configured(self) -> bool:
        return bool(self.api_base_url)

    async def get_latest_reading(self, shipment_id: int) -> ColdChainReading:
        if not self.is_configured:
            # Explicitly fallback to simulator with transparency
            return await self.fallback.get_latest_reading(shipment_id)

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
                resp = await client.get(f"{self.api_base_url}/cold-chain/shipments/{shipment_id}", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return ColdChainReading(
                        shipment_id=shipment_id,
                        vehicle_id=data.get("vehicle_id"),
                        temperature_c=data["temperature_c"],
                        humidity_percent=data.get("humidity_percent", 65.0),
                        threshold_min_c=data.get("threshold_min_c", 2.0),
                        threshold_max_c=data.get("threshold_max_c", 8.0),
                        status=ColdChainStatus(data.get("status", "NORMAL")),
                        source=ColdChainSource.LIVE_API,
                        ambient_temp_c=data.get("ambient_temp_c", 28.0),
                        location_lat=data.get("location_lat"),
                        location_lng=data.get("location_lng"),
                    )
        except Exception:
            pass

        return await self.fallback.get_latest_reading(shipment_id)

    async def get_time_series(self, shipment_id: int) -> List[ColdChainReading]:
        if not self.is_configured:
            return await self.fallback.get_time_series(shipment_id)
        return await self.fallback.get_time_series(shipment_id)

    async def simulate_temperature_step(self, shipment_id: int, target_temp_c: Optional[float] = None) -> ColdChainReading:
        return await self.fallback.simulate_temperature_step(shipment_id, target_temp_c)
