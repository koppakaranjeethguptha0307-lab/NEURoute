"""
Alert and Notification Service.
Handles operational alert dispatch, deduplication, and acknowledgement workflows.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import ResourceNotFoundError
from app.core.logging import logger
from app.models.alert import Alert
from app.repositories.alert_repository import AlertRepository
from app.schemas.enums import AlertSeverity


class AlertService:
    """Business service governing operational alerts and system notifications."""

    def __init__(self, db: Session, alert_repo: Optional[AlertRepository] = None) -> None:
        self.db = db
        self.alert_repo = alert_repo or AlertRepository(db)

    def get_alert(self, alert_id: int) -> Alert:
        """Fetch alert by ID or raise ResourceNotFoundError."""
        alert = self.alert_repo.get_by_id(alert_id)
        if not alert:
            raise ResourceNotFoundError("Alert", alert_id)
        return alert

    def list_alerts(
        self,
        severity: Optional[AlertSeverity] = None,
        unread_only: bool = False,
        limit: int = 50,
    ) -> List[Alert]:
        """List operational alerts with optional severity/unread filter."""
        if unread_only:
            return self.alert_repo.get_unread_alerts(limit=limit)
        if severity:
            return self.alert_repo.get_by_severity(severity.value, limit=limit)
        return self.alert_repo.get_all(limit=limit)

    def create_alert(
        self,
        title: str,
        message: str,
        severity: AlertSeverity = AlertSeverity.INFORMATIONAL,
        category: str = "OPERATIONAL",
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Alert:
        """Create and persist a new operational alert."""
        alert = Alert(
            title=title,
            message=message,
            severity=severity.value,
            category=category,
            entity_type=entity_type,
            entity_id=entity_id,
            is_read=False,
            is_acknowledged=False,
            metadata_json=metadata,
        )

        self.alert_repo.create(alert)
        self.db.flush()

        logger.info(
            f"Alert dispatched [{alert.severity}] {alert.title}",
            extra={"service": "alert_service", "operation": "DISPATCH", "entity_id": alert.id}
        )
        return alert

    def acknowledge_alert(self, alert_id: int, user_id: int) -> Alert:
        """Mark an alert as acknowledged and read by an authorized user."""
        alert = self.alert_repo.acknowledge_alert(alert_id, user_id)
        if not alert:
            raise ResourceNotFoundError("Alert", alert_id)
        self.db.commit()
        self.db.refresh(alert)
        return alert
