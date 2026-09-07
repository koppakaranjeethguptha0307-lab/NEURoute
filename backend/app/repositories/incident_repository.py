"""IncidentRepository for incident lifecycle and impact queries."""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.incident import Incident
from app.repositories.base import BaseRepository


class IncidentRepository(BaseRepository[Incident]):
    def __init__(self, db: Session) -> None:
        super().__init__(Incident, db)

    def get_active_incidents(self) -> List[Incident]:
        stmt = select(Incident).where(Incident.status.in_(["REPORTED", "INVESTIGATING", "CONFIRMED", "ACTIVE"]))
        return list(self.db.scalars(stmt).all())

    def get_by_road_segment(self, road_segment_id: int, active_only: bool = True) -> List[Incident]:
        stmt = select(Incident).where(Incident.road_segment_id == road_segment_id)
        if active_only:
            stmt = stmt.where(Incident.status.in_(["REPORTED", "INVESTIGATING", "CONFIRMED", "ACTIVE"]))
        return list(self.db.scalars(stmt).all())

    def get_by_category(self, category: str) -> List[Incident]:
        stmt = select(Incident).where(Incident.category == category)
        return list(self.db.scalars(stmt).all())

    def get_by_district(self, district_id: int) -> List[Incident]:
        stmt = select(Incident).where(Incident.district_id == district_id)
        return list(self.db.scalars(stmt).all())
