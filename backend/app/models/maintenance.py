import enum
from datetime import date
from uuid import UUID

from sqlalchemy import Date, Enum, ForeignKey, Numeric, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.mixins import IdMixin, TimestampMixin


class MaintenanceStatus(str, enum.Enum):
    open = "aberta"
    in_progress = "em_andamento"
    waiting_parts = "aguardando_pecas"
    completed = "concluida"
    canceled = "cancelada"


class MaintenanceOrder(IdMixin, TimestampMixin, Base):
    __tablename__ = "maintenance_orders"

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("companies.id"), index=True
    )
    equipment_unit_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("equipment_units.id"), index=True
    )
    opened_by_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    status: Mapped[MaintenanceStatus] = mapped_column(
        Enum(MaintenanceStatus), default=MaintenanceStatus.open, index=True
    )
    problem_description: Mapped[str] = mapped_column(Text, nullable=False)
    resolution_notes: Mapped[str | None] = mapped_column(Text)
    cost: Mapped[float | None] = mapped_column(Numeric(12, 2))
    due_date: Mapped[date | None] = mapped_column(Date)
    completed_on: Mapped[date | None] = mapped_column(Date)
