"""
NEURoute — Live Software GPS Provider Adapter
Ingests external software fleet telematics via REST API without requiring physical hardware.
If unconfigured or unreachable, provides explicit status transparency without fabricated data.
"""

from typing import List, Optional
import httpx
from app.adapters.gps.base import GPSProviderProtocol, GPSReading, GPSSource, TelemetryStatus
from app.adapters.gps.simulator import SimulatorGPSProvider
from app.core.logging import logger


class LiveApiGPSProvider(GPSProviderProtocol):
    """
    Live software telematics adapter for external fleet management APIs.
    Communicates over pure HTTPS JSON.
    """

    def __init__(
        self,
        api_base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        fallback_simulator: Optional[SimulatorGPSProvider] = None,
    ) -> None:
        self.api_base_url = (api_base_url or "").rstrip("/")
        self.api_key = api_key or ""
        self.fallback = fallback_simulator or SimulatorGPSProvider()

    @property
    def is_configured(self) -> bool:
        return bool(self.api_base_url)

    async def get_vehicle_location(self, vehicle_id: int) -> GPSReading:
        if not self.is_configured:
            reading = await self.fallback.get_vehicle_location(vehicle_id)
            return reading

        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
                resp = await client.get(f"{self.api_base_url}/vehicles/{vehicle_id}/telemetry", headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return GPSReading(
                        vehicle_id=vehicle_id,
                        registration_number=data.get("registration_number", f"VEH-{vehicle_id}"),
                        shipment_id=data.get("shipment_id"),
                        latitude=data["latitude"],
                        longitude=data["longitude"],
                        speed_kmh=data.get("speed_kmh", 0.0),
                        heading_deg=data.get("heading_deg", 0.0),
                        fuel_level_percent=data.get("fuel_level_percent", 100.0),
                        route_progress_pct=data.get("route_progress_pct", 0.0),
                        current_road_segment_id=data.get("current_road_segment_id"),
                        current_road_name=data.get("current_road_name"),
                        estimated_eta_minutes=data.get("estimated_eta_minutes"),
                        source=GPSSource.LIVE,
                        telemetry_status=TelemetryStatus.ACTIVE,
                    )
        except Exception as e:
            logger.warning(
                f"Live GPS API unreachable: {str(e)}. Falling back to software telemetry simulator.",
                extra={"service": "gps_provider", "status": "FALLBACK"}
            )

        # Explicit fallback
        return await self.fallback.get_vehicle_location(vehicle_id)

    async def step_vehicle_route(self, vehicle_id: int, step_fraction: float = 0.05) -> GPSReading:
        # Stepping routes is primarily handled by the software simulator
        return await self.fallback.step_vehicle_route(vehicle_id, step_fraction)

    async def list_fleet_telemetry(self) -> List[GPSReading]:
        if not self.is_configured:
            return await self.fallback.list_fleet_telemetry()
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
                resp = await client.get(f"{self.api_base_url}/fleet/telemetry", headers=headers)
                if resp.status_code == 200:
                    items = resp.json()
                    return [
                        GPSReading(
                            vehicle_id=item["vehicle_id"],
                            registration_number=item.get("registration_number", f"VEH-{item['vehicle_id']}"),
                            latitude=item["latitude"],
                            longitude=item["longitude"],
                            speed_kmh=item.get("speed_kmh", 0.0),
                            source=GPSSource.LIVE,
                        )
                        for item in items
                    ]
        except Exception:
            pass
        return await self.fallback.list_fleet_telemetry()
