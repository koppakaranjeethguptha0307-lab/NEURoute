"""UserRepository for identity and RBAC queries."""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload
from app.models.role import Role
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session) -> None:
        super().__init__(User, db)

    def get_by_username(self, username: str) -> Optional[User]:
        stmt = select(User).options(joinedload(User.role)).where(User.username == username)
        return self.db.scalars(stmt).first()

    def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).options(joinedload(User.role)).where(User.email == email)
        return self.db.scalars(stmt).first()

    def get_by_username_or_email(self, identifier: str) -> Optional[User]:
        stmt = (
            select(User)
            .options(joinedload(User.role))
            .where((User.username == identifier) | (User.email == identifier))
        )
        return self.db.scalars(stmt).first()

    def get_role_by_name(self, role_name: str) -> Optional[Role]:
        stmt = select(Role).where(Role.name == role_name)
        return self.db.scalars(stmt).first()

    def get_all_roles(self) -> List[Role]:
        stmt = select(Role)
        return list(self.db.scalars(stmt).all())
