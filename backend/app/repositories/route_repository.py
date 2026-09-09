"""RouteRepository for route plans and segment mappings."""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.route import Route, RouteSegmentMapping
from app.repositories.base import BaseRepository


class RouteRepository(BaseRepository[Route]):
    def __init__(self, db: Session) -> None:
        super().__init__(Route, db)

    def get_segments_for_route(self, route_id: int) -> List[RouteSegmentMapping]:
        stmt = (
            select(RouteSegmentMapping)
            .where(RouteSegmentMapping.route_id == route_id)
            .order_by(RouteSegmentMapping.sequence_order)
        )
        return list(self.db.scalars(stmt).all())

    def add_segment_mapping(self, route_id: int, segment_id: int, sequence_order: int) -> RouteSegmentMapping:
        mapping = RouteSegmentMapping(
            route_id=route_id,
            segment_id=segment_id,
            sequence_order=sequence_order,
        )
        self.db.add(mapping)
        self.db.flush()
        return mapping
