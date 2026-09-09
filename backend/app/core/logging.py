"""
Structured backend logging with operational context and sensitive data masking.
"""

import json
import logging
import re
import sys
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any, Dict, Optional

# Context variables for correlation tracking across async/sync calls
request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id", default=None)
user_id_ctx: ContextVar[Optional[str]] = ContextVar("user_id", default=None)

# Patterns for sensitive data masking
SENSITIVE_PATTERNS = [
    re.compile(r'(password["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])', re.IGNORECASE),
    re.compile(r'(secret["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])', re.IGNORECASE),
    re.compile(r'(token["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])', re.IGNORECASE),
    re.compile(r'(api_key["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])', re.IGNORECASE),
    re.compile(r'(authorization["\']?\s*[:=]\s*["\'])([^"\']+)(["\'])', re.IGNORECASE),
    re.compile(r'(Bearer\s+)([A-Za-z0-9\-._~+/]+=*)', re.IGNORECASE),
]


def mask_sensitive_info(text: str) -> str:
    """Mask credentials, passwords, tokens and API keys in log text."""
    if not isinstance(text, str):
        return text
    masked = text
    for pattern in SENSITIVE_PATTERNS:
        masked = pattern.sub(r'\1***REDACTED***\3' if pattern.groups == 3 else r'\1***REDACTED***', masked)
    return masked


class StructuredJsonFormatter(logging.Formatter):
    """Formats log records as structured JSON with contextual metadata."""

    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat()
        
        log_entry: Dict[str, Any] = {
            "timestamp": timestamp,
            "level": record.levelname,
            "logger": record.name,
            "message": mask_sensitive_info(record.getMessage()),
            "module": record.module,
            "line": record.lineno,
            "request_id": request_id_ctx.get(),
            "user_id": user_id_ctx.get(),
        }

        # Include custom extra attributes if passed in logger call
        if hasattr(record, "service"):
            log_entry["service"] = getattr(record, "service")
        if hasattr(record, "operation"):
            log_entry["operation"] = getattr(record, "operation")
        if hasattr(record, "entity_id"):
            log_entry["entity_id"] = getattr(record, "entity_id")
        if hasattr(record, "duration_ms"):
            log_entry["duration_ms"] = getattr(record, "duration_ms")
        if hasattr(record, "status"):
            log_entry["status"] = getattr(record, "status")
        if hasattr(record, "details"):
            log_entry["details"] = getattr(record, "details")

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)


def setup_logging(log_level: str = "INFO", json_output: bool = True) -> logging.Logger:
    """Configure root and application loggers."""
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    # Remove existing handlers to avoid duplicate logs
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    console_handler = logging.StreamHandler(sys.stdout)
    if json_output:
        console_handler.setFormatter(StructuredJsonFormatter())
    else:
        standard_format = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s] [%(module)s:%(lineno)d] %(message)s"
        )
        console_handler.setFormatter(standard_format)

    root_logger.addHandler(console_handler)

    # Suppress verbose loggers from dependencies
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("passlib").setLevel(logging.ERROR)

    logger = logging.getLogger("neuroute")
    logger.info("Structured logging initialized", extra={"service": "core", "status": "READY"})
    return logger


# Global application logger
logger = logging.getLogger("neuroute")
