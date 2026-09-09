"""VehicleRepository for fleet and driver queries."""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.vehicle import Vehicle
from app.repositories.base import BaseRepository


class VehicleRepository(BaseRepository[Vehicle]):
    def __init__(self, db: Session) -> None:
        super().__init__(Vehicle, db)

    def get_by_registration(self, registration_number: str) -> Optional[Vehicle]:
        stmt = select(Vehicle).where(Vehicle.registration_number == registration_number)
        return self.db.scalars(stmt).first()

    def get_by_status(self, status: str) -> List[Vehicle]:
        stmt = select(Vehicle).where(Vehicle.status == status)
        return list(self.db.scalars(stmt).all())

    def get_available_vehicles(self, min_capacity_kg: float = 0.0) -> List[Vehicle]:
        stmt = (
            select(Vehicle)
            .where(Vehicle.status == "AVAILABLE")
            .where(Vehicle.capacity_kg >= min_capacity_kg)
        )
        return list(self.db.scalars(stmt).all())

    def get_by_hub(self, hub_id: int) -> List[Vehicle]:
        stmt = select(Vehicle).where(Vehicle.assigned_hub_id == hub_id)
        return list(self.db.scalars(stmt).all())
