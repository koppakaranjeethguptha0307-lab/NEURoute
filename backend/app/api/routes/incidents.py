"""
NEURoute Backend Routes — Incidents & Offline Field Reports API Router
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status

from app.dependencies import get_incident_service
from app.schemas.enums import IncidentCategory
from app.schemas.incident import (
    FieldReportSync,
    IncidentCreate,
    IncidentResponse,
    IncidentStatusTransition,
)
from app.services.incident_service import IncidentService

router = APIRouter(prefix="/api/v1/incidents", tags=["Incidents & Field Reports"])


@router.get("", response_model=List[IncidentResponse], summary="List active and historical road incidents")
@router.get("/", response_model=List[IncidentResponse], include_in_schema=False)
def list_incidents(
    active_only: bool = False,
    category: Optional[IncidentCategory] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    service: IncidentService = Depends(get_incident_service),
) -> List[IncidentResponse]:
    """Retrieves operational road incidents across the North Eastern Region."""
    return service.list_incidents(active_only=active_only, category=category, skip=skip, limit=limit)


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED, summary="Report a road incident")
def report_incident(
    payload: IncidentCreate,
    service: IncidentService = Depends(get_incident_service),
) -> IncidentResponse:
    """
    Submits a geo-tagged field report. Automatically maps coordinates to nearest road segment,
    evaluates roadway status impact (OPEN/RISKY/BLOCKED), and triggers downstream alerts.
    """
    return service.report_incident(payload)


@router.get("/{incident_id}", response_model=IncidentResponse, summary="Get incident details by ID")
def get_incident(
    incident_id: str,
    service: IncidentService = Depends(get_incident_service),
) -> IncidentResponse:
    """Fetch specific incident investigation and resolution status."""
    return service.get_incident(incident_id)


@router.patch("/{incident_id}/status", response_model=IncidentResponse, summary="Transition incident status")
def update_incident_status(
    incident_id: str,
    transition: IncidentStatusTransition,
    service: IncidentService = Depends(get_incident_service),
) -> IncidentResponse:
    """Advances incident lifecycle (REPORTED -> INVESTIGATING -> CONFIRMED -> ACTIVE -> RESOLVED)."""
    return service.transition_status(incident_id, transition)


@router.post("/field-reports/sync", response_model=List[IncidentResponse], summary="Batch sync offline field reports")
def sync_offline_field_reports(
    reports: List[FieldReportSync],
    service: IncidentService = Depends(get_incident_service),
) -> List[IncidentResponse]:
    """
    Synchronizes field reports collected on mobile/low-network devices while offline.
    Idempotently processes client_report_uuid and registers valid incidents.
    """
    from app.models.field_report import FieldReport
    from app.models.incident import Incident
    import json
    import uuid

    synced_incidents = []
    for rep in reports:
        # 1. Idempotency Check: check if client_report_uuid was already processed
        existing_fr = service.db.query(FieldReport).filter(FieldReport.client_report_uuid == rep.client_report_uuid).first()
        if existing_fr:
            existing_inc = service.db.query(Incident).filter(Incident.field_report_id == existing_fr.id).first()
            if existing_inc:
                synced_incidents.append(existing_inc)
                continue

        # 2. Persist FieldReport record
        fr_id = f"fr-{uuid.uuid4().hex[:8]}"
        new_fr = FieldReport(
            id=fr_id,
            client_uuid=rep.client_report_uuid,
            client_report_uuid=rep.client_report_uuid,
            title=rep.title,
            category=rep.category.value if hasattr(rep.category, "value") else str(rep.category),
            severity=rep.severity.value if hasattr(rep.severity, "value") else str(rep.severity),
            description=rep.description,
            latitude=rep.latitude,
            longitude=rep.longitude,
            captured_at=rep.captured_at,
            photos_raw=json.dumps(rep.photos) if rep.photos else "[]",
            status="SYNCED",
        )
        service.db.add(new_fr)
        service.db.flush()

        # 3. Create and bind Incident record
        incident_in = IncidentCreate(
            title=rep.title,
            category=rep.category,
            severity=rep.severity,
            description=rep.description,
            latitude=rep.latitude,
            longitude=rep.longitude,
        )
        created = service.report_incident(incident_in)
        created.field_report_id = fr_id
        service.db.commit()
        service.db.refresh(created)
        synced_incidents.append(created)

    return synced_incidents
