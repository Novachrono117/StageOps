from uuid import UUID

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.mixins import IdMixin, TimestampMixin


class Warehouse(IdMixin, TimestampMixin, Base):
    __tablename__ = "warehouses"

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("companies.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    address: Mapped[str | None] = mapped_column(String(255))
    notes: Mapped[str | None] = mapped_column(Text)


class InternalLocation(IdMixin, TimestampMixin, Base):
    __tablename__ = "internal_locations"

    warehouse_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("warehouses.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str | None] = mapped_column(String(32), index=True)
    description: Mapped[str | None] = mapped_column(Text)
