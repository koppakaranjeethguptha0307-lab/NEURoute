"""
NEURoute Backend Routes — Admin User Management & Access Provisioning API Router
Problem Statement: SIH26002 — AI-Based Smart Logistics & Accessibility Intelligence Platform for NER
Team: Nexara
"""

from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.dependencies import get_db, require_any_role
from app.models.access_request import AccessRequest
from app.models.role import Role
from app.models.user import User
from app.schemas.enums import UserRole

router = APIRouter(
    prefix="/api/v1/admin",
    tags=["Admin & User Management"],
    dependencies=[Depends(require_any_role([UserRole.ADMIN]))],
)


class UserAdminResponse(BaseModel):
    id: Union[int, str]
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    phone_number: Optional[str] = None
    department: Optional[str] = None
    created_at: str


class CreateOperationalUserRequest(BaseModel):
    full_name: str
    email: str
    password: str
    role: str # FIELD_OFFICER, DRIVER, LOGISTICS_PLANNER, ADMIN
    phone_number: Optional[str] = None
    department: Optional[str] = None


class ToggleUserStatusRequest(BaseModel):
    is_active: bool


@router.get("/users", response_model=List[UserAdminResponse], summary="List all system users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    res = []
    for u in users:
        role_str = u.role.name if u.role and hasattr(u.role, "name") else str(u.role or "FIELD_OFFICER")
        res.append(
            UserAdminResponse(
                id=u.id,
                username=u.username,
                email=u.email,
                full_name=u.full_name,
                role=role_str,
                is_active=u.is_active,
                phone_number=u.phone_number,
                department=u.department,
                created_at=u.created_at.isoformat() if u.created_at else "",
            )
        )
    return res


@router.post("/users", response_model=UserAdminResponse, summary="Provision a new user account")
def create_user(req: CreateOperationalUserRequest, db: Session = Depends(get_db)):
    # Check duplicate
    existing = db.query(User).filter((User.email == req.email) | (User.username == req.email)).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User with email '{req.email}' already exists.")

    norm_role = req.role.upper().replace(" ", "_")
    role_obj = db.query(Role).filter(Role.name == norm_role).first()
    if not role_obj:
        role_obj = Role(name=norm_role, description=f"Role for {norm_role}")
        db.add(role_obj)
        db.flush()

    new_u = User(
        username=req.email.split("@")[0],
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        role_id=role_obj.id,
        is_active=True,
        phone_number=req.phone_number,
        department=req.department,
    )
    db.add(new_u)
    db.commit()
    db.refresh(new_u)

    return UserAdminResponse(
        id=new_u.id,
        username=new_u.username,
        email=new_u.email,
        full_name=new_u.full_name,
        role=norm_role,
        is_active=new_u.is_active,
        phone_number=new_u.phone_number,
        department=new_u.department,
        created_at=new_u.created_at.isoformat() if new_u.created_at else "",
    )


@router.patch("/users/{user_id}/status", summary="Activate or deactivate a user account")
def toggle_user_status(user_id: str, req: ToggleUserStatusRequest, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == str(user_id)).first()
    if not u:
        try:
            u = db.query(User).filter(User.id == int(user_id)).first()
        except ValueError:
            pass
    if not u:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    u.is_active = req.is_active
    db.commit()
    return {"message": f"User {u.email} status updated to is_active={u.is_active}"}


@router.get("/access-requests", summary="List all operational access requests")
def list_access_requests(db: Session = Depends(get_db)):
    reqs = db.query(AccessRequest).order_by(AccessRequest.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "full_name": r.full_name,
            "email": r.email,
            "organization": r.organization,
            "requested_role": r.requested_role,
            "phone_number": r.phone_number,
            "reason": r.reason,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else "",
        }
        for r in reqs
    ]


@router.post("/access-requests/{request_id}/approve", summary="Approve access request and provision account")
def approve_access_request(request_id: int, db: Session = Depends(get_db)):
    req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")

    if req.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Request is already {req.status}")

    # Provision user
    norm_role = req.requested_role.upper().replace(" ", "_")
    role_obj = db.query(Role).filter(Role.name == norm_role).first()
    if not role_obj:
        role_obj = Role(name=norm_role, description=f"Role for {norm_role}")
        db.add(role_obj)
        db.flush()

    existing_u = db.query(User).filter(User.email == req.email).first()
    if not existing_u:
        temp_pass = "password123" # Default demo/temp password
        new_u = User(
            username=req.email.split("@")[0],
            email=req.email,
            hashed_password=hash_password(temp_pass),
            full_name=req.full_name,
            role_id=role_obj.id,
            is_active=True,
            phone_number=req.phone_number,
            department=req.organization,
        )
        db.add(new_u)

    req.status = "APPROVED"
    db.commit()

    return {"message": f"Access request for {req.email} approved and account provisioned successfully.", "status": "APPROVED"}


@router.post("/access-requests/{request_id}/reject", summary="Reject access request")
def reject_access_request(request_id: int, db: Session = Depends(get_db)):
    req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Access request not found")

    req.status = "REJECTED"
    db.commit()
    return {"message": f"Access request for {req.email} rejected.", "status": "REJECTED"}
