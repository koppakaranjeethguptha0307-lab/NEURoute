"""AuditRepository for tracking security and operational events."""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.repositories.base import BaseRepository


class AuditRepository(BaseRepository[AuditLog]):
    def __init__(self, db: Session) -> None:
        super().__init__(AuditLog, db)

    def get_recent_logs(self, limit: int = 100) -> List[AuditLog]:
        stmt = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)
        return list(self.db.scalars(stmt).all())

    def get_by_action(self, action: str, limit: int = 50) -> List[AuditLog]:
        stmt = (
            select(AuditLog)
            .where(AuditLog.action == action)
            .order_by(AuditLog.timestamp.desc())
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def get_by_entity(self, entity_type: str, entity_id: Optional[str] = None) -> List[AuditLog]:
        stmt = select(AuditLog).where(AuditLog.entity_type == entity_type)
        if entity_id:
            stmt = stmt.where(AuditLog.entity_id == str(entity_id))
        stmt = stmt.order_by(AuditLog.timestamp.desc())
        return list(self.db.scalars(stmt).all())
