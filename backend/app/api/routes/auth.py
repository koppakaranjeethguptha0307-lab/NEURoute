"""
NEURoute Backend Routes — Authentication & User Context API Router
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, AuthorizationError
from app.dependencies import get_auth_service, get_current_active_user, get_db
from app.models.access_request import AccessRequest
from app.schemas.auth import AccessRequestCreate, AccessRequestResponse, LoginRequest, TokenResponse, UserContext
from app.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication & Identity"])


@router.post("/login", response_model=TokenResponse, summary="Authenticate user and return JWT bearer token")
def login(
    credentials: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    """Authenticates username/email and password, returning JWT bearer access token."""
    login_id = credentials.email or credentials.username
    if not login_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Username or email is required")
    try:
        user = auth_service.authenticate_user(
            username_or_email=login_id,
            plain_password=credentials.password,
            requested_role=credentials.role,
        )
        return auth_service.create_user_token(user)
    except AuthenticationError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except AuthorizationError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/request-access", response_model=AccessRequestResponse, summary="Submit a request for an operational account")
def request_access(
    req: AccessRequestCreate,
    db: Session = Depends(get_db),
) -> AccessRequestResponse:
    """Submit access request for FIELD_OFFICER, DRIVER, or LOGISTICS_PLANNER role."""
    norm_role = str(req.requested_role).upper().replace(" ", "_")
    if norm_role == "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Public ADMIN account creation is strictly forbidden. Please contact system administrators.",
        )
    if norm_role not in ["FIELD_OFFICER", "DRIVER", "LOGISTICS_PLANNER"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid requested role '{req.requested_role}'. Must be FIELD_OFFICER, DRIVER, or LOGISTICS_PLANNER.",
        )

    access_req = AccessRequest(
        full_name=req.full_name,
        email=req.email,
        organization=req.organization,
        requested_role=norm_role,
        phone_number=req.phone_number,
        reason=req.reason,
        status="PENDING",
    )
    db.add(access_req)
    db.commit()
    db.refresh(access_req)
    return access_req


@router.get("/me", response_model=UserContext, summary="Get active user profile from JWT session")
def get_current_user_profile(
    current_user: UserContext = Depends(get_current_active_user),
) -> UserContext:
    """Returns validated current active user context."""
    return current_user

