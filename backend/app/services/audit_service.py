"""
Audit Logging Service.
Records immutable audit trail entries for security, admin, and operational actions.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.logging import logger, mask_sensitive_info
from app.models.audit import AuditLog
from app.repositories.audit_repository import AuditRepository


class AuditService:
    """Business service governing security and operational audit trails."""

    def __init__(self, db: Session, audit_repo: Optional[AuditRepository] = None) -> None:
        self.db = db
        self.audit_repo = audit_repo or AuditRepository(db)

    def log_action(
        self,
        action: str,
        entity_type: str,
        entity_id: Optional[Any] = None,
        user_id: Optional[int] = None,
        username: Optional[str] = None,
        ip_address: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """Create and persist an audit log entry with sensitive data scrubbing."""
        sanitized_details = {}
        if details:
            for k, v in details.items():
                if "password" in k.lower() or "secret" in k.lower() or "token" in k.lower():
                    sanitized_details[k] = "***REDACTED***"
                elif isinstance(v, str):
                    sanitized_details[k] = mask_sensitive_info(v)
                else:
                    sanitized_details[k] = v

        audit_entry = AuditLog(
            user_id=user_id,
            username=username,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id) if entity_id is not None else None,
            ip_address=ip_address,
            details_json=sanitized_details,
        )

        self.audit_repo.create(audit_entry)
        self.db.commit()
        self.db.refresh(audit_entry)

        logger.info(
            f"Audit log recorded: {action} on {entity_type}:{entity_id} by {username or 'SYSTEM'}",
            extra={"service": "audit_service", "operation": action}
        )
        return audit_entry

    def list_logs(self, limit: int = 100) -> List[AuditLog]:
        """Fetch historical audit log entries."""
        return self.audit_repo.get_recent_logs(limit=limit)
