"""Routing provider protocol/interface definition."""

from typing import Any, Dict, List, Optional, Protocol
from pydantic import BaseModel


class RouteGeometryResult(BaseModel):
    distance_km: float
    duration_hours: float
    coordinates: List[List[float]]  # [[lat, lng], ...]
    steps: List[Dict[str, Any]] = []
    summary: str = ""
    is_mock: bool = False


class RoutingProviderProtocol(Protocol):
    """Protocol defining standard methods for external/mock routing services."""

    async def calculate_route(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        avoid_points: Optional[List[List[float]]] = None,
    ) -> RouteGeometryResult:
        """Calculate route geometry, distance and duration between two coordinates."""
        ...
