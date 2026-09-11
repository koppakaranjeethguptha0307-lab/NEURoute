"""
Seed script to initialize the 4 required roles and demo users for NEURoute.
"""

import sys
import os

# Add the backend directory to sys.path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import SessionLocal, init_db
from app.models.role import Role
from app.models.user import User
from app.schemas.enums import UserRole
from app.core.security import hash_password

def seed_auth():
    print("Initializing database...")
    init_db()

    db = SessionLocal()
    try:
        print("Seeding Roles...")
        roles = [
            {"name": UserRole.ADMIN.value, "description": "Government / Control Room"},
            {"name": UserRole.FIELD_OFFICER.value, "description": "Field Operations"},
            {"name": UserRole.DRIVER.value, "description": "Transport Operator"},
            {"name": UserRole.LOGISTICS_PLANNER.value, "description": "AI Route Intelligence"},
        ]

        role_objects = {}
        for r in roles:
            role = db.query(Role).filter(Role.name == r["name"]).first()
            if not role:
                role = Role(name=r["name"], description=r["description"])
                db.add(role)
            role_objects[r["name"]] = role
        db.commit()
        
        # Refresh role objects after commit to get IDs
        for r in roles:
            role_objects[r["name"]] = db.query(Role).filter(Role.name == r["name"]).first()

        print("Seeding Users...")
        demo_users = [
            {
                "username": "admin",
                "email": "admin@neuroute.in",
                "full_name": "Admin Control Room",
                "role_name": UserRole.ADMIN.value,
                "password": "password123",
                "department": "Command Center"
            },
            {
                "username": "field",
                "email": "field@neuroute.in",
                "full_name": "Field Operations Officer",
                "role_name": UserRole.FIELD_OFFICER.value,
                "password": "password123",
                "department": "Ground Operations"
            },
            {
                "username": "driver",
                "email": "driver@neuroute.in",
                "full_name": "Transport Driver",
                "role_name": UserRole.DRIVER.value,
                "password": "password123",
                "department": "Logistics & Cold Chain"
            },
            {
                "username": "planner",
                "email": "planner@neuroute.in",
                "full_name": "Logistics & Route Planner",
                "role_name": UserRole.LOGISTICS_PLANNER.value,
                "password": "password123",
                "department": "Route Intelligence"
            },
            {
                "username": "admin_demo",
                "email": "admin@neuroute.demo",
                "full_name": "Admin Control",
                "role_name": UserRole.ADMIN.value,
                "password": "password123",
                "department": "Command Center"
            },
            {
                "username": "field_demo",
                "email": "field@neuroute.demo",
                "full_name": "Field Officer 1",
                "role_name": UserRole.FIELD_OFFICER.value,
                "password": "password123",
                "department": "Ground Operations"
            },
            {
                "username": "driver_demo",
                "email": "driver@neuroute.demo",
                "full_name": "Transport Driver 1",
                "role_name": UserRole.DRIVER.value,
                "password": "password123",
                "department": "Logistics"
            },
            {
                "username": "planner_demo",
                "email": "planner@neuroute.demo",
                "full_name": "Logistics Planner 1",
                "role_name": UserRole.LOGISTICS_PLANNER.value,
                "password": "password123",
                "department": "Route Intelligence"
            }
        ]

        for u in demo_users:
            user = db.query(User).filter((User.email == u["email"]) | (User.username == u["username"])).first()
            if not user:
                role_obj = db.query(Role).filter(Role.name == u["role_name"]).first()
                if not role_obj:
                    continue
                user = User(
                    username=u["username"],
                    email=u["email"],
                    full_name=u["full_name"],
                    hashed_password=hash_password(u["password"]),
                    role_id=role_obj.id,
                    is_active=True,
                    department=u["department"]
                )
                db.add(user)
                db.commit()
        print("Seeding completed successfully.")

    except Exception as e:
        import traceback
        print(f"Error seeding database: {e}")
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_auth()
