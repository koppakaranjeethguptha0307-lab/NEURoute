from datetime import datetime
from typing import Any, Dict, Optional, Union
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.schemas.enums import UserRole


class LoginRequest(BaseModel):
    username: Optional[str] = Field(default=None, description="Email or username for authentication")
    email: Optional[str] = Field(default=None, description="Email for authentication")
    password: str = Field(..., description="Plaintext password")
    role: Optional[Union[UserRole, str]] = Field(default=None, description="Requested operational role")
    rememberMe: Optional[bool] = Field(default=False)


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, description="Full Name of user")
    email: EmailStr = Field(..., description="Official work email address")
    password: str = Field(..., min_length=6, description="Account password (min 6 chars)")
    confirm_password: Optional[str] = Field(default=None, description="Confirm password")
    organization: Optional[str] = Field(default=None, description="Organization / Department name")
    phone_number: Optional[str] = Field(default=None, description="Phone number")
    role: UserRole = Field(default=UserRole.FIELD_OFFICER, description="Operational role selection")
    admin_secret_key: Optional[str] = Field(default=None, description="Admin secret key if registering ADMIN role")


class AccessRequestCreate(BaseModel):
    full_name: str = Field(..., description="Full Name of applicant")
    email: str = Field(..., description="Work/Official email address")
    organization: str = Field(..., description="Organization or agency name")
    requested_role: str = Field(..., description="Role requested (FIELD_OFFICER, DRIVER, LOGISTICS_PLANNER)")
    phone_number: Optional[str] = Field(default=None)
    reason: Optional[str] = Field(default=None)


class AccessRequestResponse(BaseModel):
    id: int
    full_name: str
    email: str
    organization: str
    requested_role: str
    phone_number: Optional[str] = None
    reason: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int = 86400
    user_id: Union[str, int]
    username: Optional[str] = None
    role: Union[UserRole, str]
    full_name: Optional[str] = None
    user: Optional[Dict[str, Any]] = None


class TokenPayload(BaseModel):
    sub: str
    role: Union[UserRole, str]
    email: Optional[str] = None
    name: Optional[str] = None
    exp: int
    iat: int


class UserContext(BaseModel):
    id: Union[str, int]
    username: Optional[str] = None
    email: Optional[str] = None
    role: Union[UserRole, str]
    is_active: bool = True
    full_name: Optional[str] = None
    hubLocation: Optional[str] = None
    avatar: Optional[str] = None

