"""
Comprehensive E2E Auth & RBAC Test Suite for NEURoute FastAPI backend.
Verifies all 4 operational roles, request access, user management, and authorization guards.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies import get_db
from app.models.user import User
from app.models.role import Role
from app.core.security import hash_password

client = TestClient(app)


@pytest.fixture(autouse=True)
def override_db(db_session):
    """Override get_db dependency for TestClient to use test db_session."""
    app.dependency_overrides[get_db] = lambda: db_session
    yield
    app.dependency_overrides.clear()


def test_seed_demo_users_exist(db_session):
    """Verify all 4 required demo accounts are properly seeded in database."""
    roles_to_check = [
        ("admin@neuroute.in", "ADMIN"),
        ("field@neuroute.in", "FIELD_OFFICER"),
        ("driver@neuroute.in", "DRIVER"),
        ("planner@neuroute.in", "LOGISTICS_PLANNER"),
    ]
    for email, expected_role in roles_to_check:
        u = db_session.query(User).filter(User.email == email).first()
        assert u is not None, f"Seeded user {email} missing"
        assert u.is_active is True
        actual_role = u.role.name if u.role else ""
        assert actual_role == expected_role


@pytest.mark.parametrize(
    "email,role",
    [
        ("admin@neuroute.in", "ADMIN"),
        ("field@neuroute.in", "FIELD_OFFICER"),
        ("driver@neuroute.in", "DRIVER"),
        ("planner@neuroute.in", "LOGISTICS_PLANNER"),
    ],
)
def test_all_four_role_login_success(email, role, db_session):
    """Test successful login flow for each of the 4 operational roles."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "password123", "role": role},
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["email"] == email
    assert data["user"]["role"] == role


def test_login_invalid_password():
    """Test login failure with incorrect password returns 401."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@neuroute.in", "password": "wrongpassword", "role": "ADMIN"},
    )
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


def test_login_unknown_email():
    """Test login failure with unregistered email returns 401."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@neuroute.in", "password": "password123", "role": "ADMIN"},
    )
    assert res.status_code == 401


def test_login_role_mismatch_returns_403():
    """Test selecting a role that doesn't match account returns 403 Forbidden."""
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "field@neuroute.in", "password": "password123", "role": "ADMIN"},
    )
    assert res.status_code == 403
    assert "Selected role 'ADMIN' does not match user's assigned role" in res.json()["detail"]


def test_login_inactive_user_returns_403(db_session):
    """Test login for deactivated account returns 403 Forbidden."""
    role_obj = db_session.query(Role).filter(Role.name == "FIELD_OFFICER").first()
    inactive_u = User(
        username="inactive_test",
        email="inactive_test@neuroute.in",
        hashed_password=hash_password("password123"),
        role_id=role_obj.id,
        is_active=False,
    )
    db_session.add(inactive_u)
    db_session.flush()

    res = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive_test@neuroute.in", "password": "password123", "role": "FIELD_OFFICER"},
    )
    assert res.status_code == 403
    assert "inactive" in res.json()["detail"].lower()


def test_request_access_public_and_admin_block():
    """Test submitting access request and verifying public ADMIN role request is blocked."""
    # Attempt ADMIN request -> should fail 400
    res_admin = client.post(
        "/api/v1/auth/request-access",
        json={
            "full_name": "Bad Actor",
            "email": "hacker@domain.com",
            "organization": "Unknown",
            "requested_role": "ADMIN",
        },
    )
    assert res_admin.status_code == 400
    assert "ADMIN" in res_admin.json()["detail"]

    # Valid FIELD_OFFICER request -> should succeed 200
    res_valid = client.post(
        "/api/v1/auth/request-access",
        json={
            "full_name": "Rajesh Kumar",
            "email": "rajesh.field@ner.gov.in",
            "organization": "Assam Disaster Mgmt",
            "requested_role": "FIELD_OFFICER",
            "phone_number": "+919876543210",
            "reason": "Road maintenance monitoring in Cachar district",
        },
    )
    assert res_valid.status_code == 200
    data = res_valid.json()
    assert data["status"] == "PENDING"
    assert data["email"] == "rajesh.field@ner.gov.in"
