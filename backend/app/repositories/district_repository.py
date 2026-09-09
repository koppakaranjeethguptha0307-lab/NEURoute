"""DistrictRepository for administrative and accessibility queries."""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.district import District
from app.repositories.base import BaseRepository


class DistrictRepository(BaseRepository[District]):
    def __init__(self, db: Session) -> None:
        super().__init__(District, db)

    def get_by_name(self, name: str) -> Optional[District]:
        stmt = select(District).where(District.name == name)
        return self.db.scalars(stmt).first()

    def get_by_state(self, state: str) -> List[District]:
        stmt = select(District).where(District.state == state)
        return list(self.db.scalars(stmt).all())
