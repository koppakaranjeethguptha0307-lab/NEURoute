"""User domain schemas."""

from datetime import datetime
from typing import Any, Optional, Union
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from app.schemas.enums import UserRole


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=150)
    email: EmailStr
    full_name: Optional[str] = None
    role: Union[UserRole, str] = UserRole.FIELD_OFFICER
    is_active: bool = True
    phone_number: Optional[str] = None
    department: Optional[str] = None

    @field_validator("role", mode="before")
    @classmethod
    def serialize_role(cls, v: Any) -> str:
        if hasattr(v, "name"):
            return str(v.name)
        return str(v)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[Union[UserRole, str]] = None
    is_active: Optional[bool] = None
    phone_number: Optional[str] = None
    department: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)


class UserResponse(BaseModel):
    id: Union[str, int]
    username: Optional[str] = None
    email: EmailStr
    full_name: Optional[str] = None
    role: Union[UserRole, str]
    is_active: bool = True
    phone_number: Optional[str] = None
    department: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("role", mode="before")
    @classmethod
    def serialize_role(cls, v: Any) -> str:
        if hasattr(v, "name"):
            return str(v.name)
        return str(v)

    model_config = ConfigDict(from_attributes=True)


class RoleResponse(BaseModel):
    id: int
    name: UserRole
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
