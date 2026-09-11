"""
NEURoute Backend Routes — Government Coordination & Road Advisory API Router
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara
"""

from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid

from app.database.session import get_db
from app.models.government_advisory import GovernmentAdvisory
from app.schemas.government import GovernmentAdvisoryCreate, GovernmentAdvisoryResponse
from app.services.event_broadcaster import event_broadcaster

router = APIRouter(prefix="/api/v1/government", tags=["Government & Emergency Advisories"])


@router.get("/advisories", response_model=List[GovernmentAdvisoryResponse], summary="List active government advisories")
def list_advisories(
    active_only: bool = True,
    db: Session = Depends(get_db),
) -> List[GovernmentAdvisoryResponse]:
    """Retrieves digital road closure advisories, emergency corridor declarations, and traffic restriction notices."""
    query = db.query(GovernmentAdvisory)
    if active_only:
        query = query.filter(GovernmentAdvisory.status.in_(["ACTIVE", "RESTRICTED"]))
    advisories = query.order_by(GovernmentAdvisory.created_at.desc()).all()
    
    if not advisories:
        # Initial canonical government advisory fixture
        adv = GovernmentAdvisory(
            advisory_code="GOV-NE-2026-041",
            agency="Regional Emergency Coordination Cell (NER)",
            district="Dima Hasao",
            road="NH-06 Sonapur Sector",
            latitude=25.1120,
            longitude=92.3680,
            status="RESTRICTED",
            severity="CRITICAL",
            reason="Sonapur Tunnel Mudslide Clearance & Slope Stabilization Operation",
            vehicle_restriction="RESTRICTED_HEAVY_TRUCKS",
            emergency_override=True,
            source="SOFTWARE GOVERNMENT ADVISORY SIMULATOR",
        )
        db.add(adv)
        db.commit()
        db.refresh(adv)
        advisories = [adv]

    return advisories


@router.post("/advisories", response_model=GovernmentAdvisoryResponse, status_code=status.HTTP_201_CREATED, summary="Publish government advisory")
async def create_advisory(
    payload: GovernmentAdvisoryCreate,
    db: Session = Depends(get_db),
) -> GovernmentAdvisoryResponse:
    """Publishes a new digital government road advisory or disaster clearance notice."""
    code = payload.advisory_code or f"GOV-NE-2026-{uuid.uuid4().hex[:4].upper()}"
    adv = GovernmentAdvisory(
        advisory_code=code,
        agency=payload.agency,
        district=payload.district,
        road=payload.road,
        latitude=payload.latitude,
        longitude=payload.longitude,
        status=payload.status,
        severity=payload.severity,
        reason=payload.reason,
        vehicle_restriction=payload.vehicle_restriction,
        emergency_override=payload.emergency_override,
        source=payload.source,
    )
    db.add(adv)
    db.commit()
    db.refresh(adv)

    await event_broadcaster.broadcast("GOVERNMENT_ADVISORY", {
        "advisory_code": adv.advisory_code,
        "agency": adv.agency,
        "road": adv.road,
        "status": adv.status,
        "severity": adv.severity,
        "reason": adv.reason,
        "source": adv.source,
    })

    return adv


@router.post("/advisories/{id}/activate", response_model=GovernmentAdvisoryResponse, summary="Activate government advisory")
async def activate_advisory(
    id: int,
    db: Session = Depends(get_db),
) -> GovernmentAdvisoryResponse:
    """Enforces active traffic restrictions for a target advisory."""
    adv = db.query(GovernmentAdvisory).filter(GovernmentAdvisory.id == id).first()
    if not adv:
        raise HTTPException(status_code=404, detail="Government Advisory not found")
    adv.status = "ACTIVE"
    adv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(adv)

    await event_broadcaster.broadcast("GOVERNMENT_ADVISORY", {
        "advisory_code": adv.advisory_code,
        "status": "ACTIVE",
        "message": f"Advisory {adv.advisory_code} activated.",
    })

    return adv


@router.post("/advisories/{id}/resolve", response_model=GovernmentAdvisoryResponse, summary="Resolve government advisory")
async def resolve_advisory(
    id: int,
    db: Session = Depends(get_db),
) -> GovernmentAdvisoryResponse:
    """Lifts traffic restrictions and marks advisory resolved."""
    adv = db.query(GovernmentAdvisory).filter(GovernmentAdvisory.id == id).first()
    if not adv:
        raise HTTPException(status_code=404, detail="Government Advisory not found")
    adv.status = "RESOLVED"
    adv.end_time = datetime.now(timezone.utc)
    adv.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(adv)

    await event_broadcaster.broadcast("GOVERNMENT_ADVISORY", {
        "advisory_code": adv.advisory_code,
        "status": "RESOLVED",
        "message": f"Advisory {adv.advisory_code} cleared.",
    })

    return adv
