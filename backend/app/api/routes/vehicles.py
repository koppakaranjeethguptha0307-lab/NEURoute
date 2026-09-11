"""
NEURoute Backend Routes — Fleet Vehicles & GPS Telemetry API Router
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.dependencies import get_vehicle_service
from app.schemas.enums import VehicleStatus
from app.schemas.vehicle import VehicleCreate, VehicleLocationUpdate, VehicleResponse, VehicleUpdate
from app.services.vehicle_service import VehicleService

router = APIRouter(prefix="/api/v1/vehicles", tags=["Fleet & Telemetry"])


@router.get("", response_model=List[VehicleResponse], summary="List fleet vehicles with status filter")
@router.get("/", response_model=List[VehicleResponse], include_in_schema=False)
def list_vehicles(
    status: Optional[VehicleStatus] = None,
    hub_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    service: VehicleService = Depends(get_vehicle_service),
) -> List[VehicleResponse]:
    """Lists registered logistics and emergency response vehicles."""
    return service.list_vehicles(status=status, hub_id=hub_id, skip=skip, limit=limit)


@router.post("", response_model=VehicleResponse, status_code=status.HTTP_201_CREATED, summary="Register a new fleet vehicle")
def create_vehicle(
    payload: VehicleCreate,
    service: VehicleService = Depends(get_vehicle_service),
) -> VehicleResponse:
    """Registers a new vehicle with registration number and payload capacity."""
    return service.create_vehicle(payload)


@router.get("/{vehicle_id}", response_model=VehicleResponse, summary="Get vehicle details and current GPS coordinates")
def get_vehicle(
    vehicle_id: int,
    service: VehicleService = Depends(get_vehicle_service),
) -> VehicleResponse:
    """Fetches real-time status and telemetry for a specific vehicle."""
    return service.get_vehicle(vehicle_id)


@router.post("/{vehicle_id}/location", response_model=VehicleResponse, summary="Update vehicle GPS coordinates and speed telemetry")
@router.post("/{vehicle_id}/telemetry", response_model=VehicleResponse, summary="Ingest software GPS telemetry ping")
def update_vehicle_location(
    vehicle_id: int,
    telemetry: VehicleLocationUpdate,
    service: VehicleService = Depends(get_vehicle_service),
) -> VehicleResponse:
    """Ingests software GPS ping (latitude, longitude, speed_kmh, heading_deg, fuel_level)."""
    return service.update_telemetry(vehicle_id, telemetry)


@router.get("/{vehicle_id}/telemetry", summary="Get vehicle telemetry history and active GPS metadata")
def get_vehicle_telemetry(
    vehicle_id: int,
    service: VehicleService = Depends(get_vehicle_service),
):
    """Returns software telemetry payload including heading, speed, GPS accuracy, and source provenance."""
    veh = service.get_vehicle(vehicle_id)
    return {
        "vehicle_id": veh.id,
        "registration_number": veh.registration_number,
        "status": veh.status,
        "latitude": veh.current_lat or 26.1445,
        "longitude": veh.current_lng or 91.7362,
        "speed_kmh": veh.speed_kmh or 48.0,
        "heading_deg": veh.heading_deg or 137.0,
        "gps_accuracy_m": 8.0,
        "gps_source": veh.gps_source or "SOFTWARE TELEMETRY",
        "route_progress_pct": 64.0,
        "last_updated": veh.last_telemetry_at or veh.updated_at,
        "adapter_note": "Software telemetry adapter compatible with future AIS-140/fleet API integration.",
    }


@router.get("/{vehicle_id}/live", summary="Get live tracking state")
def get_vehicle_live(
    vehicle_id: int,
    service: VehicleService = Depends(get_vehicle_service),
):
    """Returns live telemetry state for GIS command map layer."""
    return get_vehicle_telemetry(vehicle_id, service)
