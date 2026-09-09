"""
Vehicle Business Service.
Handles fleet vehicle validation, availability, and real-time telemetry updates.
"""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import (
    BusinessRuleError,
    ConflictError,
    ResourceNotFoundError,
    ValidationError,
)
from app.core.logging import logger
from app.models.vehicle import Vehicle
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.enums import VehicleStatus
from app.schemas.vehicle import (
    VehicleCreate,
    VehicleLocationUpdate,
    VehicleUpdate,
)


class VehicleService:
    """Business service governing vehicle fleet operations and telemetry."""

    def __init__(self, db: Session, vehicle_repo: Optional[VehicleRepository] = None) -> None:
        self.db = db
        self.vehicle_repo = vehicle_repo or VehicleRepository(db)

    def get_vehicle(self, vehicle_id: int) -> Vehicle:
        """Fetch vehicle by ID or raise ResourceNotFoundError."""
        vehicle = self.vehicle_repo.get_by_id(vehicle_id)
        if not vehicle:
            raise ResourceNotFoundError("Vehicle", vehicle_id)
        return vehicle

    def get_vehicle_by_reg(self, registration_number: str) -> Vehicle:
        """Fetch vehicle by registration number."""
        vehicle = self.vehicle_repo.get_by_registration(registration_number)
        if not vehicle:
            raise ResourceNotFoundError("Vehicle", registration_number)
        return vehicle

    def list_vehicles(
        self,
        status: Optional[VehicleStatus] = None,
        hub_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Vehicle]:
        """List fleet vehicles with status/hub filters."""
        if status:
            return self.vehicle_repo.get_by_status(status.value)
        if hub_id:
            return self.vehicle_repo.get_by_hub(hub_id)
        return self.vehicle_repo.get_all(skip=skip, limit=limit)

    def create_vehicle(self, data: VehicleCreate) -> Vehicle:
        """Register a new vehicle in the logistics fleet."""
        if self.vehicle_repo.get_by_registration(data.registration_number):
            raise ConflictError(f"Vehicle with registration '{data.registration_number}' is already registered")

        if data.current_lat is not None and data.current_lng is not None:
            self._validate_coordinates(data.current_lat, data.current_lng)

        vehicle = Vehicle(
            registration_number=data.registration_number,
            vehicle_type=data.vehicle_type,
            capacity_kg=data.capacity_kg,
            driver_name=data.driver_name,
            driver_phone=data.driver_phone,
            status=VehicleStatus.AVAILABLE.value,
            assigned_hub_id=data.assigned_hub_id,
            current_lat=data.current_lat,
            current_lng=data.current_lng,
            fuel_level_percent=data.fuel_level_percent,
            last_telemetry_at=datetime.now(timezone.utc) if data.current_lat is not None else None,
        )

        self.vehicle_repo.create(vehicle)
        self.db.commit()
        self.db.refresh(vehicle)

        logger.info(
            f"Vehicle '{vehicle.registration_number}' registered in fleet",
            extra={"service": "vehicle_service", "operation": "CREATE", "entity_id": vehicle.id}
        )
        return vehicle

    def update_telemetry(self, vehicle_id: int, telemetry: VehicleLocationUpdate) -> Vehicle:
        """Update live telemetry coordinates, speed, heading, and fuel level."""
        vehicle = self.get_vehicle(vehicle_id)
        self._validate_coordinates(telemetry.lat, telemetry.lng)

        vehicle.current_lat = telemetry.lat
        vehicle.current_lng = telemetry.lng
        if telemetry.speed_kmh is not None:
            vehicle.speed_kmh = telemetry.speed_kmh
        if telemetry.heading_deg is not None:
            vehicle.heading_deg = telemetry.heading_deg
        if telemetry.fuel_level_percent is not None:
            vehicle.fuel_level_percent = telemetry.fuel_level_percent
        vehicle.last_telemetry_at = datetime.now(timezone.utc)

        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def update_status(self, vehicle_id: int, status: VehicleStatus) -> Vehicle:
        """Update vehicle operational status."""
        vehicle = self.get_vehicle(vehicle_id)
        vehicle.status = status.value
        self.db.commit()
        self.db.refresh(vehicle)
        return vehicle

    def _validate_coordinates(self, lat: float, lng: float) -> None:
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
            raise ValidationError(f"Invalid telemetry coordinates: lat={lat}, lng={lng}")
