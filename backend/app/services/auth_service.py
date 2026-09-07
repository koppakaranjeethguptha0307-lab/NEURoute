"""
Authentication Service.
Handles credential verification, JWT token issuance, user resolution, and role validation.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.core.exceptions import (
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    ResourceNotFoundError,
)
from app.core.logging import logger
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.models.role import Role
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import TokenResponse, UserContext
from app.schemas.enums import UserRole
from app.schemas.user import UserCreate, UserUpdate


class AuthService:
    """Business service for identity, authentication, and authorization."""

    def __init__(self, db: Session, user_repo: Optional[UserRepository] = None) -> None:
        self.db = db
        self.user_repo = user_repo or UserRepository(db)

    def authenticate_user(self, username_or_email: str, plain_password: str) -> User:
        """Authenticate user credentials against stored bcrypt hash."""
        user = self.user_repo.get_by_username_or_email(username_or_email)
        if not user:
            logger.warning(f"Authentication failed: User '{username_or_email}' not found")
            raise AuthenticationError("Invalid username/email or password")

        if not user.is_active:
            logger.warning(f"Authentication failed: User '{username_or_email}' account is deactivated")
            raise AuthenticationError("User account is inactive. Please contact administrator.")

        if not verify_password(plain_password, user.hashed_password):
            logger.warning(f"Authentication failed: Invalid password for user '{username_or_email}'")
            raise AuthenticationError("Invalid username/email or password")

        return user

    def create_user_token(self, user: User) -> TokenResponse:
        """Generate JWT access token response for authenticated user."""
        role_name = user.role.name if user.role else UserRole.GENERAL_VIEWER.value
        token_str = create_access_token(
            subject=user.id,
            role=role_name,
            email=user.email,
            full_name=user.full_name,
        )

        return TokenResponse(
            access_token=token_str,
            token_type="bearer",
            expires_in=1440 * 60,
            user_id=user.id,
            username=user.username,
            role=UserRole(role_name),
            full_name=user.full_name,
        )

    def get_current_user_from_token(self, token: str) -> UserContext:
        """Decode and validate access token, returning active user context."""
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Token contains no valid user subject")

        try:
            uid = int(user_id)
        except ValueError:
            raise AuthenticationError("Invalid user identifier in token")

        user = self.user_repo.get_by_id(uid)
        if not user:
            raise AuthenticationError("User referenced in token no longer exists")

        if not user.is_active:
            raise AuthenticationError("User account is deactivated")

        role_name = user.role.name if user.role else UserRole.GENERAL_VIEWER.value

        return UserContext(
            id=user.id,
            username=user.username,
            email=user.email,
            role=UserRole(role_name),
            is_active=user.is_active,
            full_name=user.full_name,
        )

    def register_user(self, user_in: UserCreate) -> User:
        """Register a new user account with duplicate checks and role assignment."""
        if self.user_repo.get_by_username(user_in.username):
            raise ConflictError(f"Username '{user_in.username}' is already taken")
        if self.user_repo.get_by_email(user_in.email):
            raise ConflictError(f"Email '{user_in.email}' is already registered")

        # Resolve or create role
        role = self.user_repo.get_role_by_name(user_in.role.value)
        if not role:
            role = Role(name=user_in.role.value, description=f"Role for {user_in.role.value}")
            self.db.add(role)
            self.db.flush()

        new_user = User(
            username=user_in.username,
            email=user_in.email,
            hashed_password=hash_password(user_in.password),
            full_name=user_in.full_name,
            role_id=role.id,
            is_active=user_in.is_active,
            phone_number=user_in.phone_number,
            department=user_in.department,
        )
        self.user_repo.create(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        return new_user

    def verify_role_permission(self, current_user_role: UserRole, allowed_roles: List[UserRole]) -> None:
        """Verify that current user's role is in the list of allowed roles."""
        if current_user_role not in allowed_roles:
            raise AuthorizationError(
                f"Role '{current_user_role.value}' is not authorized. Required: {[r.value for r in allowed_roles]}"
            )
