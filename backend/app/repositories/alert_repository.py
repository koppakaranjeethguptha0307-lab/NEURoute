"""AlertRepository for operational warnings and notifications."""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.alert import Alert
from app.repositories.base import BaseRepository


class AlertRepository(BaseRepository[Alert]):
    def __init__(self, db: Session) -> None:
        super().__init__(Alert, db)

    def get_unread_alerts(self, limit: int = 50) -> List[Alert]:
        stmt = (
            select(Alert)
            .where(Alert.is_read.is_(False))
            .order_by(Alert.created_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def get_by_severity(self, severity: str, limit: int = 50) -> List[Alert]:
        stmt = (
            select(Alert)
            .where(Alert.severity == severity)
            .order_by(Alert.created_at.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def acknowledge_alert(self, alert_id: int, user_id: int) -> Optional[Alert]:
        alert = self.get_by_id(alert_id)
        if alert:
            alert.is_acknowledged = True
            alert.is_read = True
            alert.acknowledged_by_user_id = user_id
            alert.acknowledged_at = datetime.now(timezone.utc)
            self.db.flush()
        return alert
