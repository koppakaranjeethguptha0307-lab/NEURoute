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

    def authenticate_user(self, username_or_email: str, plain_password: str, requested_role: Optional[str] = None) -> User:
        """Authenticate user credentials against stored bcrypt hash and verify role."""
        user = self.user_repo.get_by_username_or_email(username_or_email)
        if not user:
            logger.warning(f"Authentication failed: User '{username_or_email}' not found")
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            logger.warning(f"Authentication failed: User '{username_or_email}' account is deactivated")
            raise AuthorizationError("User account is inactive. Please contact administrator.")

        if not verify_password(plain_password, user.hashed_password):
            logger.warning(f"Authentication failed: Invalid password for user '{username_or_email}'")
            raise AuthenticationError("Invalid email or password")

        if requested_role:
            actual_role = (
                user.role.name
                if hasattr(user.role, "name")
                else (user.role if isinstance(user.role, str) else str(user.role))
            )
            # Normalize strings for comparison (e.g. FIELD OFFICER vs FIELD_OFFICER)
            norm_requested = str(requested_role).upper().replace(" ", "_")
            norm_actual = str(actual_role).upper().replace(" ", "_")
            if norm_requested != norm_actual:
                logger.warning(
                    f"Authentication failed: User '{username_or_email}' role mismatch (requested {norm_requested}, actual {norm_actual})"
                )
                raise AuthorizationError(f"Selected role '{requested_role}' does not match user's assigned role.")

        return user

    def create_user_token(self, user: User) -> TokenResponse:
        """Generate JWT access token response for authenticated user."""
        role_name = user.role.name if user.role else (user.role if isinstance(user.role, str) else UserRole.FIELD_OFFICER.value)
        token_str = create_access_token(
            subject=str(user.id),
            role=str(role_name),
            email=user.email,
            full_name=user.full_name,
        )

        user_dict = {
            "id": str(user.id),
            "name": user.full_name or user.username or user.email,
            "email": user.email,
            "role": role_name,
            "hubLocation": "Shillong Regional Command (Meghalaya)" if "ADMIN" in str(role_name) else "Guwahati Central Hub (Assam)",
            "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
        }

        return TokenResponse(
            access_token=token_str,
            token=token_str,
            token_type="bearer",
            expires_in=1440 * 60,
            user_id=str(user.id),
            username=user.username or user.email,
            role=role_name,
            full_name=user.full_name,
            user=user_dict,
        )

    def get_current_user_from_token(self, token: str) -> UserContext:
        """Decode and validate access token, returning active user context."""
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Token contains no valid user subject")

        user = self.user_repo.get_by_id(user_id)
        if not user:
            try:
                user = self.user_repo.get_by_id(int(user_id))
            except (ValueError, TypeError):
                pass

        if not user:
            raise AuthenticationError("User referenced in token no longer exists")

        if not user.is_active:
            raise AuthenticationError("User account is deactivated")

        role_name = user.role.name if user.role and hasattr(user.role, "name") else (user.role if isinstance(user.role, str) else UserRole.FIELD_OFFICER.value)

        return UserContext(
            id=str(user.id),
            username=user.username or user.email,
            email=user.email,
            role=role_name,
            is_active=user.is_active,
            full_name=user.full_name,
        )


    def register_user(self, user_in: UserCreate) -> User:
        """Register a new user account with duplicate checks and role assignment."""
        if self.user_repo.get_by_username(user_in.username):
            raise ConflictError(f"Username '{user_in.username}' is already taken")
        if self.user_repo.get_by_email(user_in.email):
            raise ConflictError(f"Email '{user_in.email}' is already registered")

        # Resolve or create role safely whether role is Enum or str
        role_str = user_in.role.value if hasattr(user_in.role, "value") else str(user_in.role)
        role = self.user_repo.get_role_by_name(role_str)
        if not role:
            role = Role(name=role_str, description=f"Role for {role_str}")
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
