"""
Pytest fixtures and configuration for NEURoute backend tests.
"""

import sys
from pathlib import Path
from typing import Generator
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.core.security import hash_password
from app.database.base import Base
from app.models import (
    District,
    LogisticsHub,
    RoadSegment,
    Role,
    User,
    Vehicle,
)
from app.schemas.enums import RoadStatus, UserRole, VehicleStatus


@pytest.fixture(scope="session")
def engine():
    """In-memory SQLite engine for fast isolated testing."""
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    yield test_engine
    test_engine.dispose()


@pytest.fixture(autouse=True)
def override_get_db_dependency(db_session: Session):
    """Override FastAPI get_db dependency for all test client calls across tests."""
    from app.main import app
    from app.dependencies import get_db
    app.dependency_overrides[get_db] = lambda: db_session
    yield
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def db_session(engine) -> Generator[Session, None, None]:
    """Provide a transactional database session per test with automatic rollback."""
    connection = engine.connect()
    transaction = connection.begin()
    SessionTest = sessionmaker(bind=connection, autocommit=False, autoflush=False)
    session = SessionTest()

    # Pre-seed standard roles
    for role_enum in UserRole:
        role = Role(name=role_enum.value, description=f"Role for {role_enum.value}")
        session.add(role)
    session.flush()

    role_objs = {r.name: r for r in session.query(Role).all()}
    demo_users = [
        ("admin", "admin@neuroute.in", "Admin Control", "ADMIN"),
        ("field", "field@neuroute.in", "Field Officer", "FIELD_OFFICER"),
        ("driver", "driver@neuroute.in", "Transport Driver", "DRIVER"),
        ("planner", "planner@neuroute.in", "Logistics Planner", "LOGISTICS_PLANNER"),
    ]
    for uname, email, fname, rname in demo_users:
        if rname in role_objs:
            u = User(
                username=uname,
                email=email,
                hashed_password=hash_password("password123"),
                full_name=fname,
                role_id=role_objs[rname].id,
                is_active=True,
            )
            session.add(u)
    session.flush()

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def test_users(db_session: Session) -> dict:
    """Pre-seed sample test users for RBAC testing."""
    admin_role = db_session.query(Role).filter(Role.name == UserRole.ADMIN.value).first()
    operator_role = db_session.query(Role).filter(Role.name == UserRole.LOGISTICS_PLANNER.value).first()
    viewer_role = db_session.query(Role).filter(Role.name == UserRole.DRIVER.value).first()

    admin = User(
        username="admin_user",
        email="admin@neuroute.gov.in",
        hashed_password=hash_password("admin_pass123"),
        full_name="Admin Officer",
        role_id=admin_role.id,
        is_active=True,
    )
    operator = User(
        username="planner_user",
        email="planner@neuroute.gov.in",
        hashed_password=hash_password("planner_pass123"),
        full_name="Logistics Planner",
        role_id=operator_role.id,
        is_active=True,
    )
    viewer = User(
        username="driver_user",
        email="driver@neuroute.gov.in",
        hashed_password=hash_password("driver_pass123"),
        full_name="Transport Operator",
        role_id=viewer_role.id,
        is_active=True,
    )

    db_session.add_all([admin, operator, viewer])
    db_session.flush()

    return {"admin": admin, "operator": operator, "viewer": viewer}


@pytest.fixture
def sample_road_segment(db_session: Session) -> RoadSegment:
    """Pre-seed a sample NER highway road segment."""
    district = District(
        name="East Khasi Hills",
        state="Meghalaya",
        headquarters="Shillong",
        accessibility_score=1.0,
        total_road_km=150.0,
        blocked_road_km=0.0,
        active_incidents_count=0,
    )
    db_session.add(district)
    db_session.flush()

    segment = RoadSegment(
        segment_code="NH-06-MEGH-01",
        name="Guwahati - Shillong Lifeline Corridor",
        highway_number="NH-06",
        district_id=district.id,
        start_lat=26.1445,
        start_lng=91.7362,
        end_lat=25.5788,
        end_lng=91.8933,
        length_km=98.5,
        elevation_gain_m=1450.0,
        is_critical_lifeline=True,
        current_status=RoadStatus.OPEN.value,
        risk_score=0.10,
        speed_limit_kmh=45.0,
    )
    db_session.add(segment)
    db_session.flush()
    return segment


@pytest.fixture
def sample_vehicle(db_session: Session) -> Vehicle:
    """Pre-seed a test fleet truck."""
    vehicle = Vehicle(
        registration_number="AS-01-EC-9001",
        vehicle_type="Heavy All-Terrain Truck",
        capacity_kg=8000.0,
        driver_name="Tenzing Lhadon",
        driver_phone="+91-9876543210",
        status=VehicleStatus.AVAILABLE.value,
        current_lat=26.1445,
        current_lng=91.7362,
        fuel_level_percent=95.0,
    )
    db_session.add(vehicle)
    db_session.flush()
    return vehicle
