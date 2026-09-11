"""
Unit tests for security, password hashing, JWT token lifecycle, and role authorization.
"""

from datetime import timedelta
import pytest
from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.dependencies import require_any_role, require_role
from app.schemas.auth import UserContext
from app.schemas.enums import UserRole
from app.services.auth_service import AuthService


def test_password_hashing_and_verification():
    """Verify that bcrypt hashing produces distinct salts and validates correctly."""
    plain = "Secur3Passw0rd!NER"
    hashed = hash_password(plain)

    assert hashed != plain
    assert verify_password(plain, hashed) is True
    assert verify_password("WrongPassword", hashed) is False
    assert verify_password("", hashed) is False


def test_jwt_token_generation_and_decoding():
    """Verify JWT token claims encoding and valid decoding."""
    token = create_access_token(
        subject=42,
        role=UserRole.LOGISTICS_PLANNER.value,
        email="operator@neuroute.gov.in",
        full_name="Logistics Officer",
    )

    payload = decode_access_token(token)
    assert payload["sub"] == "42"
    assert payload["role"] == UserRole.LOGISTICS_PLANNER.value
    assert payload["email"] == "operator@neuroute.gov.in"
    assert payload["name"] == "Logistics Officer"
    assert "exp" in payload


def test_jwt_token_expiration():
    """Verify that expired tokens raise AuthenticationError."""
    expired_token = create_access_token(
        subject=1,
        role=UserRole.ADMIN.value,
        expires_delta=timedelta(seconds=-10),
    )

    with pytest.raises(AuthenticationError) as excinfo:
        decode_access_token(expired_token)
    assert "expired" in str(excinfo.value).lower()


def test_invalid_jwt_token():
    """Verify that malformed or forged tokens raise AuthenticationError."""
    with pytest.raises(AuthenticationError):
        decode_access_token("invalid.token.payload")

    with pytest.raises(AuthenticationError):
        decode_access_token("")


def test_auth_service_successful_login(db_session, test_users):
    """Verify AuthService authenticates valid credentials and returns token."""
    auth_service = AuthService(db_session)
    user = auth_service.authenticate_user("admin_user", "admin_pass123")
    assert user.id == test_users["admin"].id

    token_resp = auth_service.create_user_token(user)
    assert token_resp.access_token is not None
    assert token_resp.role == UserRole.ADMIN
    assert token_resp.username == "admin_user"


def test_auth_service_invalid_login(db_session, test_users):
    """Verify AuthService rejects invalid password or non-existent user."""
    auth_service = AuthService(db_session)
    with pytest.raises(AuthenticationError):
        auth_service.authenticate_user("admin_user", "incorrect_password")

    with pytest.raises(AuthenticationError):
        auth_service.authenticate_user("non_existent_user", "some_password")


def test_role_authorization_dependency():
    """Verify RBAC role enforcement functions."""
    admin_ctx = UserContext(id=1, username="admin", role=UserRole.ADMIN, is_active=True)
    operator_ctx = UserContext(id=2, username="op", role=UserRole.LOGISTICS_PLANNER, is_active=True)
    viewer_ctx = UserContext(id=3, username="viewer", role=UserRole.FIELD_OFFICER, is_active=True)

    # require_role for LOGISTICS_PLANNER
    check_operator = require_role(UserRole.LOGISTICS_PLANNER)
    res = check_operator(current_user=operator_ctx)
    assert res.id == 2

    with pytest.raises(AuthorizationError):
        check_operator(current_user=viewer_ctx)

    # require_any_role for multiple
    check_multi = require_any_role([UserRole.DRIVER, UserRole.LOGISTICS_PLANNER])
    assert check_multi(operator_ctx) == operator_ctx

    with pytest.raises(AuthorizationError):
        check_multi(viewer_ctx)
