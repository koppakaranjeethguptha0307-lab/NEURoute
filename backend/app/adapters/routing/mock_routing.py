"""
Deterministic NER Routing Adapter for offline testing and demo mode.
Provides realistic highway coordinates and travel calculations across North Eastern Region lifelines.
"""

import math
from typing import List, Optional
from app.adapters.routing.base import RouteGeometryResult, RoutingProviderProtocol


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate great-circle distance between two points in kilometers."""
    r = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


class MockRoutingAdapter(RoutingProviderProtocol):
    """Deterministic routing provider for North Eastern Region."""

    # Key regional landmarks for interpolation
    NER_LANDMARKS = [
        {"name": "Guwahati (Assam Hub)", "lat": 26.1445, "lng": 91.7362},
        {"name": "Jorabat Junction", "lat": 26.1082, "lng": 91.8765},
        {"name": "Nongpoh (Meghalaya)", "lat": 25.9034, "lng": 91.8812},
        {"name": "Shillong Lifeline Hub", "lat": 25.5788, "lng": 91.8933},
        {"name": "Jowai (East Jaintia)", "lat": 25.4526, "lng": 92.2035},
        {"name": "Sonapur Tunnel Pass", "lat": 25.1120, "lng": 92.3650},
        {"name": "Silchar Forward Hub", "lat": 24.8333, "lng": 92.7789},
        {"name": "Nagaon Bypass", "lat": 26.3452, "lng": 92.6840},
        {"name": "Kaziranga Corridor", "lat": 26.5775, "lng": 93.1711},
        {"name": "Jorhat Railhead", "lat": 26.7509, "lng": 94.2037},
        {"name": "Dibrugarh Terminal", "lat": 27.4728, "lng": 94.9120},
        {"name": "Dimapur Gateway", "lat": 25.9068, "lng": 93.7274},
        {"name": "Kohima Hills", "lat": 25.6701, "lng": 94.1077},
        {"name": "Imphal Hub", "lat": 24.8170, "lng": 93.9368},
        {"name": "Moreh Border Post", "lat": 24.2464, "lng": 94.3050},
    ]

    async def calculate_route(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        avoid_points: Optional[List[List[float]]] = None,
    ) -> RouteGeometryResult:
        """Generate deterministic route coordinates and metrics."""
        straight_km = haversine_distance_km(origin_lat, origin_lng, dest_lat, dest_lng)
        
        # NER Mountain road winding factor (tortuosity: 1.35x - 1.5x)
        winding_factor = 1.42
        actual_distance_km = round(max(straight_km * winding_factor, 1.0), 1)

        # Average mountain highway speed: 38 km/h
        avg_speed_kmh = 38.0
        duration_hours = round(actual_distance_km / avg_speed_kmh, 2)

        # Generate interpolated waypoint line
        num_points = max(int(actual_distance_km / 15), 5)
        coordinates: List[List[float]] = []

        for i in range(num_points + 1):
            fraction = i / num_points
            lat = origin_lat + (dest_lat - origin_lat) * fraction
            lng = origin_lng + (dest_lng - origin_lng) * fraction
            
            # Add minor mountain curve displacement
            if 0 < i < num_points:
                curve_offset = math.sin(fraction * math.pi) * 0.015
                lat += curve_offset
                lng -= curve_offset * 0.5
                
            coordinates.append([round(lat, 5), round(lng, 5)])

        # Ensure start and end exactness
        coordinates[0] = [origin_lat, origin_lng]
        coordinates[-1] = [dest_lat, dest_lng]

        return RouteGeometryResult(
            distance_km=actual_distance_km,
            duration_hours=duration_hours,
            coordinates=coordinates,
            steps=[
                {"instruction": f"Depart from origin ({origin_lat:.4f}, {origin_lng:.4f})", "distance_km": round(actual_distance_km * 0.3, 1)},
                {"instruction": "Proceed via primary NER highway lifeline", "distance_km": round(actual_distance_km * 0.5, 1)},
                {"instruction": f"Arrive at destination ({dest_lat:.4f}, {dest_lng:.4f})", "distance_km": round(actual_distance_km * 0.2, 1)},
            ],
            summary="Primary NER Highway Corridor (NH Route)",
            is_mock=True,
        )
