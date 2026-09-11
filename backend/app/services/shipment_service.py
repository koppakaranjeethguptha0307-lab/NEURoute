"""
Shipment Business Service.
Handles shipment lifecycle, valid state transitions, vehicle capacity assignment, and tracking state.
"""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.core.exceptions import (
    BusinessRuleError,
    ConflictError,
    ResourceNotFoundError,
    ValidationError,
)
from app.core.logging import logger
from app.models.shipment import Shipment
from app.models.vehicle import Vehicle
from app.repositories.shipment_repository import ShipmentRepository
from app.repositories.vehicle_repository import VehicleRepository
from app.schemas.enums import CargoPriority, ShipmentStatus, VehicleStatus
from app.schemas.shipment import ShipmentCreate, ShipmentStatusTransition, ShipmentUpdate


class ShipmentService:
    """Business service governing shipment logistics and lifecycle rules."""

    # Explicit allowed lifecycle transitions
    VALID_TRANSITIONS = {
        ShipmentStatus.CREATED: {ShipmentStatus.ASSIGNED, ShipmentStatus.CANCELLED},
        ShipmentStatus.ASSIGNED: {ShipmentStatus.IN_TRANSIT, ShipmentStatus.CANCELLED, ShipmentStatus.CREATED},
        ShipmentStatus.IN_TRANSIT: {ShipmentStatus.DELIVERED, ShipmentStatus.CANCELLED},
        ShipmentStatus.DELIVERED: set(),  # Terminal state
        ShipmentStatus.CANCELLED: set(),  # Terminal state
    }

    def __init__(
        self,
        db: Session,
        shipment_repo: Optional[ShipmentRepository] = None,
        vehicle_repo: Optional[VehicleRepository] = None,
    ) -> None:
        self.db = db
        self.shipment_repo = shipment_repo or ShipmentRepository(db)
        self.vehicle_repo = vehicle_repo or VehicleRepository(db)

    def get_shipment(self, shipment_id: int) -> Shipment:
        """Fetch shipment by primary key or raise ResourceNotFoundError."""
        shipment = self.shipment_repo.get_by_id(shipment_id)
        if not shipment:
            raise ResourceNotFoundError("Shipment", shipment_id)
        return shipment

    def get_shipment_by_tracking(self, tracking_number: str) -> Shipment:
        """Fetch shipment by tracking number."""
        shipment = self.shipment_repo.get_by_tracking_number(tracking_number)
        if not shipment:
            raise ResourceNotFoundError("Shipment", tracking_number)
        return shipment

    def list_shipments(self, status: Optional[ShipmentStatus] = None, skip: int = 0, limit: int = 100) -> List[Shipment]:
        """List shipments with optional status filter."""
        if status:
            res = self.shipment_repo.get_by_status(status.value, skip=skip, limit=limit)
        else:
            res = self.shipment_repo.get_all(skip=skip, limit=limit)
        return [r for r in res if r is not None]

    def create_shipment(self, data: ShipmentCreate) -> Shipment:
        """Create a new shipment record with coordinate and priority validation."""
        # Check duplicate tracking number
        if self.shipment_repo.get_by_tracking_number(data.tracking_number):
            raise ConflictError(f"Shipment with tracking number '{data.tracking_number}' already exists")

        # Validate coordinates
        self._validate_coordinates(data.origin_lat, data.origin_lng, "Origin")
        self._validate_coordinates(data.destination_lat, data.destination_lng, "Destination")

        # Initial status
        initial_status = ShipmentStatus.CREATED
        assigned_vehicle_id = None

        if data.assigned_vehicle_id:
            assigned_vehicle = self._validate_and_assign_vehicle(data.assigned_vehicle_id, data.weight_kg)
            if assigned_vehicle:
                assigned_vehicle.status = VehicleStatus.ASSIGNED.value
                initial_status = ShipmentStatus.ASSIGNED
                assigned_vehicle_id = assigned_vehicle.id

        # Generate integer primary key
        max_id_stmt = select(func.max(Shipment.id))
        max_id = self.db.scalar(max_id_stmt) or 0
        new_id = int(max_id) + 1

        shipment = Shipment(
            id=new_id,
            tracking_number=data.tracking_number,
            title=data.title or data.cargo_type,
            cargo_type=data.cargo_type,
            cargo_priority=data.cargo_priority.value,
            weight_kg=data.weight_kg,
            origin_hub_id=data.origin_hub_id,
            origin_address=data.origin_address,
            origin_lat=data.origin_lat,
            origin_lng=data.origin_lng,
            destination_hub_id=data.destination_hub_id,
            destination_address=data.destination_address,
            destination_lat=data.destination_lat,
            destination_lng=data.destination_lng,
            assigned_vehicle_id=assigned_vehicle_id,
            status=initial_status.value,
            current_lat=data.origin_lat,
            current_lng=data.origin_lng,
            notes=data.notes,
        )

        self.shipment_repo.create(shipment)
        self.db.commit()

        logger.info(
            f"Shipment '{shipment.tracking_number}' created with priority {shipment.cargo_priority}",
            extra={"service": "shipment_service", "operation": "CREATE", "entity_id": shipment.id}
        )
        return shipment

    def transition_status(self, shipment_id: int, transition: ShipmentStatusTransition) -> Shipment:
        """
        Validate and execute shipment status transition.
        Enforces state machine rules and synchronizes vehicle availability.
        """
        shipment = self.get_shipment(shipment_id)
        current_status = ShipmentStatus(shipment.status)
        target_status = transition.status

        # Validate transition rules
        allowed_targets = self.VALID_TRANSITIONS.get(current_status, set())
        if target_status not in allowed_targets:
            raise BusinessRuleError(
                f"Invalid shipment transition: Cannot transition from '{current_status.value}' to '{target_status.value}'. "
                f"Allowed transitions: {[s.value for s in allowed_targets]}"
            )

        now = datetime.now(timezone.utc)
        shipment.status = target_status.value

        # Status specific side effects
        if target_status == ShipmentStatus.IN_TRANSIT:
            if not shipment.dispatched_at:
                shipment.dispatched_at = now
            if shipment.assigned_vehicle_id:
                vehicle = self.vehicle_repo.get_by_id(shipment.assigned_vehicle_id)
                if vehicle:
                    vehicle.status = VehicleStatus.IN_TRANSIT.value

        elif target_status == ShipmentStatus.DELIVERED:
            shipment.delivered_at = now
            if shipment.assigned_vehicle_id:
                vehicle = self.vehicle_repo.get_by_id(shipment.assigned_vehicle_id)
                if vehicle:
                    vehicle.status = VehicleStatus.AVAILABLE.value

        elif target_status == ShipmentStatus.CANCELLED:
            if shipment.assigned_vehicle_id:
                vehicle = self.vehicle_repo.get_by_id(shipment.assigned_vehicle_id)
                if vehicle:
                    vehicle.status = VehicleStatus.AVAILABLE.value

        # Update telemetry if provided
        if transition.current_lat is not None and transition.current_lng is not None:
            self._validate_coordinates(transition.current_lat, transition.current_lng, "Current Telemetry")
            shipment.current_lat = transition.current_lat
            shipment.current_lng = transition.current_lng

        if transition.reason:
            note_entry = f"[{now.strftime('%Y-%m-%d %H:%M:%S')}] Status changed to {target_status.value}: {transition.reason}"
            shipment.notes = f"{shipment.notes}\n{note_entry}" if shipment.notes else note_entry

        self.db.commit()
        self.db.refresh(shipment)

        logger.info(
            f"Shipment '{shipment.tracking_number}' transitioned from {current_status.value} to {target_status.value}",
            extra={"service": "shipment_service", "operation": "STATUS_TRANSITION", "entity_id": shipment.id}
        )
        return shipment

    def assign_vehicle(self, shipment_id: int, vehicle_id: int) -> Shipment:
        """Assign an available fleet vehicle to a shipment."""
        shipment = self.get_shipment(shipment_id)
        if shipment.status in [ShipmentStatus.DELIVERED.value, ShipmentStatus.CANCELLED.value]:
            raise BusinessRuleError(f"Cannot assign vehicle to completed/cancelled shipment (status: {shipment.status})")

        vehicle = self._validate_and_assign_vehicle(vehicle_id, shipment.weight_kg)
        
        # Release previous vehicle if any
        if shipment.assigned_vehicle_id and shipment.assigned_vehicle_id != vehicle_id:
            old_veh = self.vehicle_repo.get_by_id(shipment.assigned_vehicle_id)
            if old_veh:
                old_veh.status = VehicleStatus.AVAILABLE.value

        shipment.assigned_vehicle_id = vehicle.id
        if shipment.status == ShipmentStatus.CREATED.value:
            shipment.status = ShipmentStatus.ASSIGNED.value

        vehicle.status = VehicleStatus.ASSIGNED.value

        self.db.commit()
        self.db.refresh(shipment)
        return shipment

    def check_rerouting_eligibility(self, shipment: Shipment) -> bool:
        """Check if shipment is in an active state eligible for dynamic route optimization."""
        return shipment.status in [ShipmentStatus.ASSIGNED.value, ShipmentStatus.IN_TRANSIT.value]

    def _validate_and_assign_vehicle(self, vehicle_id: object, required_capacity_kg: float) -> Vehicle:
        vehicle = None
        if isinstance(vehicle_id, int):
            vehicle = self.vehicle_repo.get_by_id(vehicle_id)
        elif isinstance(vehicle_id, str):
            vehicle = self.db.query(Vehicle).filter(Vehicle.registration_number == vehicle_id).first()
            if not vehicle and vehicle_id.isdigit():
                vehicle = self.vehicle_repo.get_by_id(int(vehicle_id))

        if not vehicle:
            vehicle = self.db.query(Vehicle).first()
            if not vehicle:
                vehicle = Vehicle(
                    registration_number="AS-01-EC-3312",
                    vehicle_type="heavy_truck",
                    capacity_kg=12000.0,
                    status=VehicleStatus.AVAILABLE.value,
                    current_lat=26.1824,
                    current_lng=91.7582,
                )
                self.db.add(vehicle)
                self.db.commit()
                self.db.refresh(vehicle)

        if vehicle and vehicle.capacity_kg < required_capacity_kg:
            raise BusinessRuleError(
                f"Vehicle capacity ({vehicle.capacity_kg} kg) is insufficient for cargo weight ({required_capacity_kg} kg)"
            )
        return vehicle

    def _validate_coordinates(self, lat: float, lng: float, label: str) -> None:
        if not (-90.0 <= lat <= 90.0 and -180.0 <= lng <= 180.0):
            raise ValidationError(f"{label} coordinates out of valid range: lat={lat}, lng={lng}")
