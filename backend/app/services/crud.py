from typing import Any, Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType")
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDService(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: type[ModelType]):
        self.model = model

    def list(self, db: Session, *, skip: int = 0, limit: int = 100) -> list[ModelType]:
        statement = select(self.model).offset(skip).limit(limit)
        return list(db.scalars(statement).all())

    def get(self, db: Session, id: UUID) -> ModelType | None:
        return db.get(self.model, id)

    def create(self, db: Session, data: CreateSchemaType) -> ModelType:
        obj = self.model(**data.model_dump())
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    def update(
        self, db: Session, obj: ModelType, data: UpdateSchemaType | dict[str, Any]
    ) -> ModelType:
        payload = (
            data.model_dump(exclude_unset=True)
            if isinstance(data, BaseModel)
            else {key: value for key, value in data.items() if value is not None}
        )
        for field, value in payload.items():
            setattr(obj, field, value)
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    def delete(self, db: Session, obj: ModelType) -> None:
        db.delete(obj)
        db.commit()
