"""Authentication request and response schemas."""

from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.schemas.enums import UserRole


class LoginRequest(BaseModel):
    username: str = Field(..., description="Email or username for authentication")
    password: str = Field(..., description="Plaintext password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: int
    username: str
    role: UserRole
    full_name: Optional[str] = None


class TokenPayload(BaseModel):
    sub: str
    role: UserRole
    email: Optional[str] = None
    name: Optional[str] = None
    exp: int
    iat: int


class UserContext(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    role: UserRole
    is_active: bool = True
    full_name: Optional[str] = None
