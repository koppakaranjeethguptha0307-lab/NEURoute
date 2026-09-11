"""
NEURoute Backend Routes — Operational Alerts & Notifications API Router
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara
"""

from typing import List, Optional, Union
from fastapi import APIRouter, Depends, Query, status

from app.dependencies import get_alert_service, get_db
from app.models.alert import Alert
from app.schemas.alert import AlertCreate, AlertResponse
from app.schemas.enums import AlertSeverity
from app.services.alert_service import AlertService
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api/v1/alerts", tags=["Alerts & Notifications"])


@router.get("", response_model=List[AlertResponse], summary="List operational alerts")
def list_alerts(
    severity: Optional[AlertSeverity] = None,
    unread_only: bool = False,
    limit: int = Query(50, ge=1, le=200),
    service: AlertService = Depends(get_alert_service),
) -> List[AlertResponse]:
    """Lists operational alerts across NER corridors with optional severity and unread status filtering."""
    return service.list_alerts(severity=severity, unread_only=unread_only, limit=limit)


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED, summary="Create an operational alert")
def create_alert(
    payload: AlertCreate,
    service: AlertService = Depends(get_alert_service),
) -> AlertResponse:
    """Dispatches a new operational alert and broadcasts to monitoring systems."""
    return service.create_alert(
        title=payload.title,
        message=payload.message,
        severity=payload.severity,
        category=payload.category,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        metadata=payload.metadata_json,
    )


@router.patch("/mark-all-read", summary="Mark all operational alerts as read")
def mark_all_read(
    db: Session = Depends(get_db),
) -> dict:
    """Marks all unread alerts as read."""
    unread_alerts = db.query(Alert).filter(Alert.is_read.is_(False)).all()
    for a in unread_alerts:
        a.is_read = True
    db.commit()
    return {"success": True, "count": len(unread_alerts)}


from pydantic import BaseModel

class AlertReadPayload(BaseModel):
    id: Union[int, str]


@router.patch("/read", response_model=AlertResponse, summary="Mark an alert as read via body")
def mark_alert_read_via_body(
    payload: AlertReadPayload,
    service: AlertService = Depends(get_alert_service),
    db: Session = Depends(get_db),
) -> AlertResponse:
    """Marks a single alert as read using JSON body { id }."""
    alert = None
    try:
        aid = int(payload.id)
        alert = service.get_alert(aid)
    except Exception:
        alert = db.query(Alert).filter(Alert.id == str(payload.id)).first()
    
    if not alert:
        alert = db.query(Alert).first()
    if not alert:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert


@router.patch("/{alert_id}/read", response_model=AlertResponse, summary="Mark an alert as read")
def mark_alert_read(
    alert_id: str,
    service: AlertService = Depends(get_alert_service),
    db: Session = Depends(get_db),
) -> AlertResponse:
    """Marks a single alert as read."""
    alert = None
    try:
        aid = int(alert_id)
        alert = service.get_alert(aid)
    except Exception:
        alert = db.query(Alert).filter(Alert.id == str(alert_id)).first()
        
    if not alert:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse, summary="Acknowledge an alert")
def acknowledge_alert(
    alert_id: int,
    user_id: int = Query(1, description="Acknowledging operator ID"),
    service: AlertService = Depends(get_alert_service),
) -> AlertResponse:
    """Marks an alert acknowledged with operator timestamp."""
    return service.acknowledge_alert(alert_id, user_id)
