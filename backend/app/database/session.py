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

db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

if settings.is_production and settings.is_sqlite:
    raise RuntimeError(
        "CRITICAL DATABASE ERROR: Production mode requires a PostgreSQL + PostGIS database. "
        "SQLite runtime fallback is disabled in production. Set DATABASE_URL environment variable."
    )

connect_args = {}
engine_kwargs = {"pool_pre_ping": True}

if settings.is_sqlite:
    connect_args = {"check_same_thread": False}
else:
    engine_kwargs.update({
        "pool_size": 10,
        "max_overflow": 20,
    })

engine = create_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs,
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
        
        # If using PostgreSQL, attempt to create extension PostGIS
        if not settings.is_sqlite:
            try:
                with engine.connect() as conn:
                    conn.execute(Base.metadata.schema and None or __import__('sqlalchemy').text("CREATE EXTENSION IF NOT EXISTS postgis;"))
                    conn.commit()
            except Exception as pe:
                logger.warning(f"PostGIS extension creation notice/warning: {pe}")

        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully", extra={"service": "database", "status": "INITIALIZED"})
    except Exception as e:
        logger.error(f"Failed to initialize database tables: {str(e)}", extra={"service": "database", "status": "ERROR"})
        raise
