"""Generic Base Repository isolating SQLAlchemy session operations."""

from typing import Any, Dict, Generic, List, Optional, Type, TypeVar
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from app.database.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Abstract generic repository providing standardized CRUD persistence operations."""

    def __init__(self, model: Type[ModelType], db: Session) -> None:
        self.model = model
        self.db = db

    def get_by_id(self, id: Any) -> Optional[ModelType]:
        """Fetch a single record by primary key."""
        return self.db.get(self.model, id)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[ModelType]:
        """Fetch multiple records with offset pagination."""
        stmt = select(self.model).offset(skip).limit(limit)
        return list(self.db.scalars(stmt).all())

    def count(self) -> int:
        """Get total count of records."""
        stmt = select(func.count()).select_from(self.model)
        return self.db.scalar(stmt) or 0

    def create(self, obj: ModelType) -> ModelType:
        """Persist a new entity to database session."""
        self.db.add(obj)
        self.db.flush()
        return obj

    def update(self, obj: ModelType) -> ModelType:
        """Flush changes to existing entity."""
        self.db.flush()
        return obj

    def delete(self, obj: ModelType) -> None:
        """Delete an entity."""
        self.db.delete(obj)
        self.db.flush()
