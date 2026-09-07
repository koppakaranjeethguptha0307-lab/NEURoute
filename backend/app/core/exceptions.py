"""
Centralized backend exception hierarchy for the NEURoute platform.
Provides consistent error structures that can be seamlessly mapped to API responses.
"""

from typing import Any, Dict, Optional


class NEURouteError(Exception):
    """Base exception for all NEURoute platform domain errors."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details,
            }
        }


class ApplicationError(NEURouteError):
    """General application-level error."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            message=message,
            code="APPLICATION_ERROR",
            status_code=500,
            details=details,
        )


class ValidationError(NEURouteError):
    """Raised when domain validation fails."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
            details=details,
        )


class AuthenticationError(NEURouteError):
    """Raised when authentication fails or credentials are invalid."""

    def __init__(self, message: str = "Invalid authentication credentials", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            message=message,
            code="AUTHENTICATION_FAILED",
            status_code=401,
            details=details,
        )


class AuthorizationError(NEURouteError):
    """Raised when the user lacks required permissions or roles."""

    def __init__(self, message: str = "Permission denied", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=403,
            details=details,
        )


class ResourceNotFoundError(NEURouteError):
    """Raised when a requested resource is not found."""

    def __init__(self, resource_type: str, resource_id: Any, details: Optional[Dict[str, Any]] = None) -> None:
        message = f"{resource_type} with identifier '{resource_id}' was not found"
        super().__init__(
            message=message,
            code="RESOURCE_NOT_FOUND",
            status_code=404,
            details=details or {"resource_type": resource_type, "resource_id": str(resource_id)},
        )


class ConflictError(NEURouteError):
    """Raised when an operation creates a conflict with current state."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            message=message,
            code="RESOURCE_CONFLICT",
            status_code=409,
            details=details,
        )


class BusinessRuleError(NEURouteError):
    """Raised when a business transition or operational constraint is violated."""

    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            message=message,
            code="BUSINESS_RULE_VIOLATION",
            status_code=400,
            details=details,
        )


class ProviderError(NEURouteError):
    """Raised when an external provider (routing, weather) fails."""

    def __init__(self, provider_name: str, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            message=f"External provider '{provider_name}' error: {message}",
            code="PROVIDER_ERROR",
            status_code=502,
            details=details or {"provider": provider_name},
        )


class ExternalServiceError(NEURouteError):
    """Raised when an external network service or AI module is unreachable or times out."""

    def __init__(self, service_name: str, message: str, details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            message=f"External service '{service_name}' failure: {message}",
            code="EXTERNAL_SERVICE_UNAVAILABLE",
            status_code=503,
            details=details or {"service": service_name},
        )


class DatabaseError(NEURouteError):
    """Raised when a database query or transaction fails."""

    def __init__(self, message: str = "Database operation failed", details: Optional[Dict[str, Any]] = None) -> None:
        super().__init__(
            message=message,
            code="DATABASE_ERROR",
            status_code=500,
            details=details,
        )
