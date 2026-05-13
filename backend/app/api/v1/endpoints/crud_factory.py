from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.services.crud import CRUDService


def build_crud_router(
    *,
    service: CRUDService[Any, Any, Any],
    create_schema: type[BaseModel],
    update_schema: type[BaseModel],
    read_schema: type[BaseModel],
) -> APIRouter:
    router = APIRouter(dependencies=[Depends(get_current_user)])

    @router.get("/", response_model=list[read_schema])  # type: ignore[valid-type]
    def list_items(
        db: Session = Depends(get_db), skip: int = 0, limit: int = 100
    ) -> list[Any]:
        return service.list(db, skip=skip, limit=limit)

    @router.post("/", response_model=read_schema, status_code=201)  # type: ignore[valid-type]
    def create_item(payload: create_schema, db: Session = Depends(get_db)) -> Any:  # type: ignore[valid-type]
        return service.create(db, payload)

    @router.get("/{item_id}", response_model=read_schema)  # type: ignore[valid-type]
    def get_item(item_id: UUID, db: Session = Depends(get_db)) -> Any:
        obj = service.get(db, item_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Registro nao encontrado")
        return obj

    @router.patch("/{item_id}", response_model=read_schema)  # type: ignore[valid-type]
    def update_item(
        item_id: UUID, payload: update_schema, db: Session = Depends(get_db)  # type: ignore[valid-type]
    ) -> Any:
        obj = service.get(db, item_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Registro nao encontrado")
        return service.update(db, obj, payload)

    @router.delete("/{item_id}", status_code=204)
    def delete_item(item_id: UUID, db: Session = Depends(get_db)) -> None:
        obj = service.get(db, item_id)
        if not obj:
            raise HTTPException(status_code=404, detail="Registro nao encontrado")
        service.delete(db, obj)

    return router
