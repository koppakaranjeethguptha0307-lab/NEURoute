"""
Test suite for NEURote Account Registration, Admin Protection, and Instant Login Flow.
"""

import time
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_register_field_officer_success(db_session):
    email = f"test_field_{int(time.time())}@neuroute.in"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Test Field Officer",
            "email": email,
            "password": "securepassword123",
            "confirm_password": "securepassword123",
            "organization": "SDRF Assam",
            "role": "FIELD_OFFICER"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == email
    assert data["role"] == "FIELD_OFFICER"

    # Verify instant login with registered credentials
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": email,
            "password": "securepassword123",
            "role": "FIELD_OFFICER"
        }
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["role"] == "FIELD_OFFICER"


def test_register_driver_and_planner_success(db_session):
    timestamp = int(time.time())
    for role_name in ["DRIVER", "LOGISTICS_PLANNER"]:
        email = f"test_{role_name.lower()}_{timestamp}@neuroute.in"
        res = client.post(
            "/api/v1/auth/register",
            json={
                "full_name": f"Test {role_name}",
                "email": email,
                "password": "securepassword123",
                "role": role_name
            }
        )
        assert res.status_code == 201
        assert res.json()["role"] == role_name

        # Verify instant login
        login_res = client.post(
            "/api/v1/auth/login",
            json={
                "email": email,
                "password": "securepassword123",
                "role": role_name
            }
        )
        assert login_res.status_code == 200


def test_register_duplicate_email_conflict(db_session):
    email = "admin@neuroute.in"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Duplicate User",
            "email": email,
            "password": "securepassword123",
            "confirm_password": "securepassword123",
            "role": "FIELD_OFFICER"
        }
    )
    assert response.status_code == 409
    assert "already registered" in response.json()["detail"]


def test_register_admin_without_secret_key_blocked(db_session):
    email = f"unauthorized_admin_{int(time.time())}@neuroute.in"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Rogue Admin",
            "email": email,
            "password": "securepassword123",
            "role": "ADMIN"
        }
    )
    assert response.status_code == 403
    assert "Administrator Authorization Key" in response.json()["detail"]


def test_register_admin_with_valid_secret_key_success(db_session):
    email = f"authorized_admin_{int(time.time())}@neuroute.in"
    response = client.post(
        "/api/v1/auth/register",
        json={
            "full_name": "Authorized Admin",
            "email": email,
            "password": "securepassword123",
            "role": "ADMIN",
            "admin_secret_key": "neuroute-admin-secret-2026"
        }
    )
    assert response.status_code == 201
    assert response.json()["role"] == "ADMIN"
