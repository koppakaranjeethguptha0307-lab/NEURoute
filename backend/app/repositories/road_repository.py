"""RoadRepository for road network segments and lifeline corridors."""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.road import RoadSegment
from app.repositories.base import BaseRepository


class RoadRepository(BaseRepository[RoadSegment]):
    def __init__(self, db: Session) -> None:
        super().__init__(RoadSegment, db)

    def get_by_segment_code(self, segment_code: str) -> Optional[RoadSegment]:
        stmt = select(RoadSegment).where(RoadSegment.segment_code == segment_code)
        return self.db.scalars(stmt).first()

    def get_by_highway(self, highway_number: str) -> List[RoadSegment]:
        stmt = select(RoadSegment).where(RoadSegment.highway_number == highway_number)
        return list(self.db.scalars(stmt).all())

    def get_by_status(self, status: str) -> List[RoadSegment]:
        stmt = select(RoadSegment).where(RoadSegment.current_status == status)
        return list(self.db.scalars(stmt).all())

    def get_by_district(self, district_id: int) -> List[RoadSegment]:
        stmt = select(RoadSegment).where(RoadSegment.district_id == district_id)
        return list(self.db.scalars(stmt).all())

    def get_critical_lifelines(self) -> List[RoadSegment]:
        stmt = select(RoadSegment).where(RoadSegment.is_critical_lifeline.is_(True))
        return list(self.db.scalars(stmt).all())
