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

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def test_users(db_session: Session) -> dict:
    """Pre-seed sample test users for RBAC testing."""
    admin_role = db_session.query(Role).filter(Role.name == UserRole.ADMIN.value).first()
    operator_role = db_session.query(Role).filter(Role.name == UserRole.LOGISTICS_OPERATOR.value).first()
    viewer_role = db_session.query(Role).filter(Role.name == UserRole.GENERAL_VIEWER.value).first()

    admin = User(
        username="admin_user",
        email="admin@neuroute.gov.in",
        hashed_password=hash_password("admin_pass123"),
        full_name="Admin Officer",
        role_id=admin_role.id,
        is_active=True,
    )
    operator = User(
        username="operator_user",
        email="operator@neuroute.gov.in",
        hashed_password=hash_password("operator_pass123"),
        full_name="Logistics Controller",
        role_id=operator_role.id,
        is_active=True,
    )
    viewer = User(
        username="viewer_user",
        email="viewer@neuroute.gov.in",
        hashed_password=hash_password("viewer_pass123"),
        full_name="Public Viewer",
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
