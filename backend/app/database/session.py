"""
Database engine, sessionmaker and dependency generator.
Supports SQLite (for zero-config local dev/tests) and PostgreSQL+PostGIS (for production).
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.logging import logger
from app.database.base import Base

connect_args = {}
if settings.is_sqlite:
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for obtaining a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database tables if they do not already exist."""
    try:
        # Import all models so metadata is complete
        import app.models  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully", extra={"service": "database", "status": "INITIALIZED"})
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {str(e)}", extra={"service": "database", "status": "ERROR"})
        raise
