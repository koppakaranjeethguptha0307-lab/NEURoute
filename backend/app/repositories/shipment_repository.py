"""ShipmentRepository for logistics operations."""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.shipment import Shipment
from app.repositories.base import BaseRepository


class ShipmentRepository(BaseRepository[Shipment]):
    def __init__(self, db: Session) -> None:
        super().__init__(Shipment, db)

    def get_by_tracking_number(self, tracking_number: str) -> Optional[Shipment]:
        stmt = select(Shipment).where(Shipment.tracking_number == tracking_number)
        return self.db.scalars(stmt).first()

    def get_by_status(self, status: str, skip: int = 0, limit: int = 100) -> List[Shipment]:
        stmt = select(Shipment).where(Shipment.status == status).offset(skip).limit(limit)
        return list(self.db.scalars(stmt).all())

    def get_by_vehicle(self, vehicle_id: int) -> List[Shipment]:
        stmt = select(Shipment).where(Shipment.assigned_vehicle_id == vehicle_id)
        return list(self.db.scalars(stmt).all())

    def get_active_shipments(self) -> List[Shipment]:
        stmt = select(Shipment).where(Shipment.status.in_(["ASSIGNED", "IN_TRANSIT"]))
        return list(self.db.scalars(stmt).all())
