"""
NEURoute — Software-Only GPS Simulator Provider
Simulates realistic vehicle movement along authentic North Eastern Region highway lifelines.
Example Primary Corridor: Guwahati -> Sonapur (NH-06 km 42) -> Jowai -> Umrangso -> Silchar
Guarantees source="SIMULATED" across all generated records.
"""

import math
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from app.adapters.gps.base import GPSProviderProtocol, GPSReading, GPSSource, TelemetryStatus

# Predefined GIS waypoints for the Guwahati to Silchar Mountain Lifeline
# (Guwahati -> Sonapur Gorge -> Jowai Ridge -> Umrangso Relief Bypass -> Silchar Depot)
GUWAHATI_SILCHAR_CORRIDOR: List[Tuple[float, float, str, str]] = [
    (26.1824, 91.7582, "hub-ghy-01", "Guwahati Strategic Logistics Terminal (NH-27)"),
    (26.1150, 91.9780, "seg-nh27-01", "Guwahati-Sonapur Four-Lane Arterial (NH-27)"),
    (25.9810, 92.2140, "seg-nh06-01", "Ri-Bhoi Mountain Gateway (NH-06 km 18)"),
    (25.8200, 92.2900, "seg-nh06-02", "Umiam Ridge Descent (NH-06 km 30)"),
    (25.1120, 92.3680, "seg-nh06-03", "Sonapur Tunnel Gorge Chokepoint (NH-06 km 42)"),
    (25.4410, 92.2110, "seg-jow-01", "Jowai Uplands Chokepoint (NH-06 / NH-44E)"),
    (25.5120, 92.7480, "seg-umr-01", "Umrangso Relief Arterial Bypass (NH-27 / NH-627)"),
    (25.3200, 92.8900, "seg-umr-02", "Khandong Hill Pass Section (NH-627)"),
    (25.0200, 92.8100, "seg-sil-01", "Cachar Northern Approach (NH-37)"),
    (24.8270, 92.7959, "hub-sil-01", "Silchar Southern Valley Forward Depot (Barak Valley)"),
]


def _calculate_heading(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes compass heading in degrees from point 1 to point 2."""
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlon_r = math.radians(lon2 - lon1)
    x = math.sin(dlon_r) * math.cos(lat2_r)
    y = math.cos(lat1_r) * math.sin(lat2_r) - math.sin(lat1_r) * math.cos(lat2_r) * math.cos(dlon_r)
    initial_bearing = math.atan2(x, y)
    initial_bearing = math.degrees(initial_bearing)
    return round((initial_bearing + 360) % 360, 1)


class SimulatorGPSProvider(GPSProviderProtocol):
    """
    In-memory software telemetry simulator moving fleet vehicles along real NER GIS corridors.
    Adheres strictly to the identical GPSProviderProtocol used by live hardware/API providers.
    """

    def __init__(self) -> None:
        # State tracking: vehicle_id -> current progress index float [0.0, len(waypoints) - 1]
        self._fleet_progress: Dict[int, float] = {
            1: 0.0,   # Vehicle 1 (AS-01-EC-3312) starts at Guwahati
            2: 2.0,   # Vehicle 2 at Ri-Bhoi
            3: 4.0,   # Vehicle 3 near Sonapur
            4: 6.0,   # Vehicle 4 at Umrangso
            5: 8.0,   # Vehicle 5 approaching Silchar
            6: 0.0,   # Vehicle 6 at Guwahati
        }
        self._vehicle_metadata: Dict[int, Dict[str, str]] = {
            1: {"reg": "AS-01-EC-3312", "type": "Refrigerated Van (Medical/Insulin)", "shp_id": 1},
            2: {"reg": "ML-05-AA-9981", "type": "4x4 Mountain Rescue", "shp_id": 2},
            3: {"reg": "AS-01-GA-4412", "type": "Heavy Supply Truck", "shp_id": 3},
            4: {"reg": "NL-07-B-7711", "type": "Fuel Tanker", "shp_id": 4},
            5: {"reg": "TR-01-C-5520", "type": "Food Grain Carrier", "shp_id": 5},
            6: {"reg": "AS-01-GH-2201", "type": "Standard Transport", "shp_id": 6},
        }

    def _interpolate_position(self, progress: float) -> Tuple[float, float, float, str, str, float]:
        """
        Interpolates coordinates, heading, segment ID, road name, and progress %
        given a floating point progress index.
        """
        waypoints = GUWAHATI_SILCHAR_CORRIDOR
        n = len(waypoints)
        progress = max(0.0, min(float(n - 1), progress))
        
        idx = int(progress)
        frac = progress - idx

        if idx >= n - 1:
            lat, lng, seg_id, road_name = waypoints[-1]
            heading = 180.0
            pct = 100.0
        else:
            w1 = waypoints[idx]
            w2 = waypoints[idx + 1]
            lat = w1[0] + frac * (w2[0] - w1[0])
            lng = w1[1] + frac * (w2[1] - w1[1])
            heading = _calculate_heading(w1[0], w1[1], w2[0], w2[1])
            seg_id = w1[2]
            road_name = w1[3]
            pct = round((progress / (n - 1)) * 100.0, 1)

        speed = 42.5 if 0.0 < pct < 100.0 else 0.0
        return lat, lng, heading, seg_id, road_name, pct, speed

    async def get_vehicle_location(self, vehicle_id: int) -> GPSReading:
        progress = self._fleet_progress.get(vehicle_id, 0.0)
        meta = self._vehicle_metadata.get(vehicle_id, {"reg": f"AS-01-TEST-{vehicle_id}", "shp_id": None})
        
        lat, lng, heading, seg_id, road_name, pct, speed = self._interpolate_position(progress)
        
        # Calculate remaining ETA in minutes (~375 km total corridor)
        remaining_km = 375.0 * (1.0 - (pct / 100.0))
        eta_minutes = round((remaining_km / 40.0) * 60.0, 1) if speed > 0 else 0.0

        return GPSReading(
            vehicle_id=vehicle_id,
            registration_number=meta.get("reg", f"VEH-{vehicle_id}"),
            shipment_id=meta.get("shp_id"),
            latitude=round(lat, 5),
            longitude=round(lng, 5),
            speed_kmh=speed,
            heading_deg=heading,
            fuel_level_percent=max(15.0, round(98.0 - (pct * 0.45), 1)),
            route_progress_pct=pct,
            current_road_segment_id=seg_id,
            current_road_name=road_name,
            estimated_eta_minutes=eta_minutes,
            source=GPSSource.SIMULATED,
            telemetry_status=TelemetryStatus.IN_TRANSIT if 0 < pct < 100 else TelemetryStatus.IDLE,
            timestamp=datetime.now(timezone.utc),
        )

    async def step_vehicle_route(self, vehicle_id: int, step_fraction: float = 0.5) -> GPSReading:
        """Advance the vehicle in software simulation by a given step increment."""
        current = self._fleet_progress.get(vehicle_id, 0.0)
        n = len(GUWAHATI_SILCHAR_CORRIDOR)
        new_progress = min(float(n - 1), current + step_fraction)
        self._fleet_progress[vehicle_id] = new_progress
        return await self.get_vehicle_location(vehicle_id)

    async def reset_vehicle(self, vehicle_id: int, progress: float = 0.0) -> GPSReading:
        """Reset vehicle to initial origin waypoint."""
        self._fleet_progress[vehicle_id] = progress
        return await self.get_vehicle_location(vehicle_id)

    async def list_fleet_telemetry(self) -> List[GPSReading]:
        readings = []
        for vid in sorted(self._fleet_progress.keys()):
            readings.append(await self.get_vehicle_location(vid))
        return readings
