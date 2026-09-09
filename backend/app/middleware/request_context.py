"""
Request context and correlation middleware for FastAPI.
Injects correlation IDs, tracks process timing, and formats structured error responses.
"""

import time
import uuid
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.exceptions import NEURouteError
from app.core.logging import logger, request_id_ctx


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Middleware for injecting correlation request IDs, timing requests, and handling errors."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Retrieve or generate correlation ID
        req_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        token = request_id_ctx.set(req_id)

        start_time = time.perf_counter()

        try:
            response = await call_next(request)
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

            response.headers["X-Request-ID"] = req_id
            response.headers["X-Process-Time"] = f"{duration_ms}ms"

            # Log non-health check requests
            if not request.url.path.endswith("/health"):
                logger.info(
                    f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)",
                    extra={
                        "service": "http",
                        "operation": f"{request.method} {request.url.path}",
                        "duration_ms": duration_ms,
                        "status": response.status_code,
                    }
                )

            return response

        except NEURouteError as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.warning(
                f"Domain exception on {request.method} {request.url.path}: [{exc.code}] {exc.message}",
                extra={
                    "service": "http",
                    "operation": f"{request.method} {request.url.path}",
                    "duration_ms": duration_ms,
                    "status": exc.status_code,
                    "details": exc.details,
                }
            )
            return JSONResponse(
                status_code=exc.status_code,
                content={
                    "error": {
                        "code": exc.code,
                        "message": exc.message,
                        "details": exc.details,
                        "request_id": req_id,
                    }
                },
                headers={"X-Request-ID": req_id, "X-Process-Time": f"{duration_ms}ms"},
            )

        except Exception as exc:
            duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
            logger.error(
                f"Unhandled server error on {request.method} {request.url.path}: {str(exc)}",
                exc_info=True,
                extra={
                    "service": "http",
                    "operation": f"{request.method} {request.url.path}",
                    "duration_ms": duration_ms,
                    "status": 500,
                }
            )
            return JSONResponse(
                status_code=500,
                content={
                    "error": {
                        "code": "INTERNAL_SERVER_ERROR",
                        "message": "An unexpected internal server error occurred",
                        "details": {},
                        "request_id": req_id,
                    }
                },
                headers={"X-Request-ID": req_id, "X-Process-Time": f"{duration_ms}ms"},
            )

        finally:
            request_id_ctx.reset(token)
