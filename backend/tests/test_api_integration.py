"""
Integration tests for FastAPI application core endpoints, middleware, and health probes.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_root_endpoint(client):
    """Verify root metadata endpoint returns platform info and version."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "platform" in data
    assert "version" in data
    assert "docs" in data
    assert response.headers.get("X-Request-ID") is not None
    assert response.headers.get("X-Process-Time") is not None


def test_health_endpoint(client):
    """Verify health inspection probe checks database and subsystem readiness."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "components" in data
    assert "database" in data["components"]
    assert data["components"]["database"]["status"] == "healthy"
    assert "routing_provider" in data["components"]
    assert "weather_provider" in data["components"]
    assert "ai_services" in data["components"]
