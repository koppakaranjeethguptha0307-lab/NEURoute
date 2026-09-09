"""
Unit and integration tests for logistics shipments, vehicles, incidents, and alert business rules.
"""

import pytest
from app.core.exceptions import BusinessRuleError, ConflictError, ValidationError
from app.schemas.enums import (
    AlertSeverity,
    CargoPriority,
    IncidentCategory,
    IncidentSeverity,
    IncidentStatus,
    RoadStatus,
    ShipmentStatus,
    VehicleStatus,
)
from app.schemas.incident import IncidentCreate, IncidentStatusTransition
from app.schemas.shipment import ShipmentCreate, ShipmentStatusTransition
from app.services.alert_service import AlertService
from app.services.incident_service import IncidentService
from app.services.shipment_service import ShipmentService
from app.services.vehicle_service import VehicleService


def test_shipment_creation_and_valid_lifecycle(db_session, sample_vehicle):
    """Verify complete valid shipment lifecycle: CREATED -> ASSIGNED -> IN_TRANSIT -> DELIVERED."""
    shipment_service = ShipmentService(db_session)

    create_data = ShipmentCreate(
        tracking_number="NER-SHP-2026-001",
        title="Emergency Medical Relief (Vaccines)",
        cargo_type="Medical Supplies",
        cargo_priority=CargoPriority.CRITICAL,
        weight_kg=2500.0,
        origin_address="Guwahati Central Depot",
        origin_lat=26.1445,
        origin_lng=91.7362,
        destination_address="Shillong Civil Hospital Hub",
        destination_lat=25.5788,
        destination_lng=91.8933,
        assigned_vehicle_id=sample_vehicle.id,
    )

    shipment = shipment_service.create_shipment(create_data)
    assert shipment.id is not None
    assert shipment.status == ShipmentStatus.ASSIGNED.value
    assert sample_vehicle.status == VehicleStatus.ASSIGNED.value

    # Transition to IN_TRANSIT
    in_transit = shipment_service.transition_status(
        shipment.id,
        ShipmentStatusTransition(status=ShipmentStatus.IN_TRANSIT, current_lat=25.9034, current_lng=91.8812)
    )
    assert in_transit.status == ShipmentStatus.IN_TRANSIT.value
    assert in_transit.dispatched_at is not None
    assert in_transit.current_lat == 25.9034
    assert sample_vehicle.status == VehicleStatus.IN_TRANSIT.value

    # Transition to DELIVERED
    delivered = shipment_service.transition_status(
        shipment.id,
        ShipmentStatusTransition(status=ShipmentStatus.DELIVERED, reason="Consignment handed over to CMO Shillong")
    )
    assert delivered.status == ShipmentStatus.DELIVERED.value
    assert delivered.delivered_at is not None
    assert sample_vehicle.status == VehicleStatus.AVAILABLE.value


def test_shipment_invalid_lifecycle_transition(db_session):
    """Verify state machine rejects invalid jumps (e.g. CREATED -> DELIVERED)."""
    shipment_service = ShipmentService(db_session)

    create_data = ShipmentCreate(
        tracking_number="NER-SHP-INVALID-01",
        title="General Supplies",
        cargo_type="Rations",
        cargo_priority=CargoPriority.NORMAL,
        weight_kg=1000.0,
        origin_address="Guwahati",
        origin_lat=26.1445,
        origin_lng=91.7362,
        destination_address="Jorhat",
        destination_lat=26.7509,
        destination_lng=94.2037,
    )
    shipment = shipment_service.create_shipment(create_data)
    assert shipment.status == ShipmentStatus.CREATED.value

    # Cannot jump directly to DELIVERED
    with pytest.raises(BusinessRuleError) as excinfo:
        shipment_service.transition_status(
            shipment.id,
            ShipmentStatusTransition(status=ShipmentStatus.DELIVERED)
        )
    assert "Cannot transition from 'CREATED' to 'DELIVERED'" in str(excinfo.value)


def test_shipment_vehicle_capacity_exceeded(db_session, sample_vehicle):
    """Verify vehicle assignment fails if cargo weight exceeds capacity."""
    shipment_service = ShipmentService(db_session)

    create_data = ShipmentCreate(
        tracking_number="NER-SHP-OVERWEIGHT-01",
        title="Heavy Construction Material",
        cargo_type="Steel Rebar",
        cargo_priority=CargoPriority.NORMAL,
        weight_kg=12000.0,  # Exceeds sample_vehicle capacity of 8000kg
        origin_address="Guwahati",
        origin_lat=26.1445,
        origin_lng=91.7362,
        destination_address="Silchar",
        destination_lat=24.8333,
        destination_lng=92.7789,
        assigned_vehicle_id=sample_vehicle.id,
    )

    with pytest.raises(BusinessRuleError) as excinfo:
        shipment_service.create_shipment(create_data)
    assert "insufficient for cargo weight" in str(excinfo.value)


def test_incident_reporting_and_road_blockage_impact(db_session, sample_road_segment):
    """
    Verify multi-step incident transaction:
    Report Landslide -> Segment status becomes BLOCKED -> Alert generated -> Resolve incident -> Segment opens.
    """
    alert_service = AlertService(db_session)
    incident_service = IncidentService(db_session, alert_service=alert_service)

    assert sample_road_segment.current_status == RoadStatus.OPEN.value

    # Report severe landslide
    inc_data = IncidentCreate(
        title="Major Landslide near Sonapur Tunnel Pass",
        category=IncidentCategory.LANDSLIDE,
        severity=IncidentSeverity.CRITICAL,
        description="Massive rockfall blocking both highway carriageways.",
        latitude=25.1120,
        longitude=92.3650,
        road_segment_id=sample_road_segment.id,
        blocked_lanes=2,
        passable_by_heavy_vehicles=False,
        estimated_clearance_hours=8.0,
    )

    incident = incident_service.report_incident(inc_data)
    assert incident.id is not None
    assert incident.status == IncidentStatus.REPORTED.value

    # Verify road segment operational status was updated to BLOCKED
    assert sample_road_segment.current_status == RoadStatus.BLOCKED.value
    assert sample_road_segment.risk_score >= 0.90

    # Verify operational alert was automatically dispatched
    unread_alerts = alert_service.list_alerts(severity=AlertSeverity.CRITICAL)
    assert len(unread_alerts) >= 1
    assert "Major Landslide" in unread_alerts[0].message

    # Transition incident to RESOLVED
    incident_service.transition_status(
        incident.id,
        IncidentStatusTransition(status=IncidentStatus.RESOLVED, resolution_notes="Debris cleared by BRO bulldozers")
    )

    # Road segment should be re-evaluated and reset to OPEN
    assert sample_road_segment.current_status == RoadStatus.OPEN.value
    assert sample_road_segment.risk_score <= 0.10
