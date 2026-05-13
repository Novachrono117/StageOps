from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class EntityRead(OrmBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
