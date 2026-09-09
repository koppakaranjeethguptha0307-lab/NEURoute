"""
OSRM HTTP Routing Adapter with automatic fallback.
"""

from typing import List, Optional
import httpx
from app.adapters.routing.base import RouteGeometryResult, RoutingProviderProtocol
from app.adapters.routing.mock_routing import MockRoutingAdapter
from app.core.config import settings
from app.core.logging import logger


class OSRMRoutingAdapter(RoutingProviderProtocol):
    """OSRM (Open Source Routing Machine) integration adapter."""

    def __init__(self, base_url: Optional[str] = None, timeout: float = 5.0) -> None:
        self.base_url = (base_url or settings.ROUTING_PROVIDER_URL).rstrip("/")
        self.timeout = timeout
        self.fallback = MockRoutingAdapter()

    async def calculate_route(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        avoid_points: Optional[List[List[float]]] = None,
    ) -> RouteGeometryResult:
        """Call OSRM service with coordinates (lng,lat order for OSRM URL)."""
        url = f"{self.base_url}/route/v1/driving/{origin_lng},{origin_lat};{dest_lng},{dest_lat}?overview=full&geometries=geojson&steps=true"
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    if data.get("code") == "Ok" and data.get("routes"):
                        route = data["routes"][0]
                        dist_km = round(route["distance"] / 1000.0, 1)
                        dur_hr = round(route["duration"] / 3600.0, 2)
                        
                        # OSRM geojson coordinates are [lng, lat], convert to [lat, lng]
                        coords = [[p[1], p[0]] for p in route["geometry"]["coordinates"]]
                        
                        return RouteGeometryResult(
                            distance_km=dist_km,
                            duration_hours=dur_hr,
                            coordinates=coords,
                            summary=route.get("legs", [{}])[0].get("summary", "OSRM Calculated Route"),
                            is_mock=False,
                        )
        except Exception as e:
            logger.warning(
                f"OSRM routing request failed: {str(e)}. Falling back to deterministic NER routing.",
                extra={"service": "routing_adapter", "status": "FALLBACK"}
            )

        # Fallback to deterministic mock routing
        return await self.fallback.calculate_route(
            origin_lat, origin_lng, dest_lat, dest_lng, avoid_points
        )
