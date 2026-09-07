"""Core package containing configuration, security, logging and exceptions."""

from app.core.config import settings
from app.core.exceptions import (
    NEURouteError,
    ApplicationError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    ResourceNotFoundError,
    ConflictError,
    BusinessRuleError,
    ProviderError,
    ExternalServiceError,
    DatabaseError,
)
from app.core.logging import logger, setup_logging
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

__all__ = [
    "settings",
    "logger",
    "setup_logging",
    "hash_password",
    "verify_password",
    "create_access_token",
    "decode_access_token",
    "NEURouteError",
    "ApplicationError",
    "ValidationError",
    "AuthenticationError",
    "AuthorizationError",
    "ResourceNotFoundError",
    "ConflictError",
    "BusinessRuleError",
    "ProviderError",
    "ExternalServiceError",
    "DatabaseError",
]
