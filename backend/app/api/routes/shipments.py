"""
NEURoute Backend Routes — Shipment Logistics API Router
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.exceptions import ResourceNotFoundError, ValidationError, ConflictError, BusinessRuleError
from app.dependencies import get_shipment_service
from app.schemas.enums import ShipmentStatus
from app.schemas.shipment import ShipmentCreate, ShipmentResponse, ShipmentStatusTransition
from app.services.shipment_service import ShipmentService

router = APIRouter(prefix="/api/v1/shipments", tags=["Logistics & Shipments"])


@router.get("", response_model=List[ShipmentResponse], summary="List shipments with optional status filter")
@router.get("/", response_model=List[ShipmentResponse], include_in_schema=False)
def list_shipments(
    status: Optional[ShipmentStatus] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    service: ShipmentService = Depends(get_shipment_service),
) -> List[ShipmentResponse]:
    """Retrieves operational shipments across NER corridors."""
    return service.list_shipments(status=status, skip=skip, limit=limit)


@router.post("", response_model=ShipmentResponse, status_code=status.HTTP_201_CREATED, summary="Create new freight consignment")
def create_shipment(
    payload: ShipmentCreate,
    service: ShipmentService = Depends(get_shipment_service),
) -> ShipmentResponse:
    """Dispatches a new shipment with origin, destination, cargo classification, and priority."""
    return service.create_shipment(payload)


@router.get("/{shipment_id}", response_model=ShipmentResponse, summary="Get shipment details by ID")
def get_shipment(
    shipment_id: int,
    service: ShipmentService = Depends(get_shipment_service),
) -> ShipmentResponse:
    """Fetch shipment status and journey history by primary key."""
    return service.get_shipment(shipment_id)


@router.patch("/{shipment_id}/status", response_model=ShipmentResponse, summary="Transition shipment status")
def update_shipment_status(
    shipment_id: int,
    transition: ShipmentStatusTransition,
    service: ShipmentService = Depends(get_shipment_service),
) -> ShipmentResponse:
    """Update shipment status along valid state transition lifecycles."""
    return service.transition_status(shipment_id, transition)


@router.post("/{shipment_id}/assign-vehicle/{vehicle_id}", response_model=ShipmentResponse, summary="Assign vehicle to shipment")
def assign_vehicle(
    shipment_id: int,
    vehicle_id: int,
    service: ShipmentService = Depends(get_shipment_service),
) -> ShipmentResponse:
    """Allocates an available fleet vehicle to an active shipment."""
    return service.assign_vehicle(shipment_id, vehicle_id)
