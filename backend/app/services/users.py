from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.models.people import User
from app.schemas.domain import UserCreate, UserUpdate
from app.services.crud import CRUDService


class UserService(CRUDService[User, UserCreate, UserUpdate]):
    def create(self, db: Session, data: UserCreate) -> User:
        payload = data.model_dump(exclude={"password"})
        user = User(**payload, hashed_password=get_password_hash(data.password))
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update(self, db: Session, obj: User, data: UserUpdate) -> User:
        payload = data.model_dump(exclude_unset=True, exclude={"password"})
        if data.password:
            payload["hashed_password"] = get_password_hash(data.password)
        return super().update(db, obj, payload)

    def get_by_email(self, db: Session, email: str) -> User | None:
        return db.scalar(select(User).where(User.email == email))

    def authenticate(self, db: Session, email: str, password: str) -> User | None:
        user = self.get_by_email(db, email)
        if not user or not verify_password(password, user.hashed_password):
            return None
        return user


user_service = UserService(User)
