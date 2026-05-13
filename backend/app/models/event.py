import enum
from datetime import date
from uuid import UUID

from sqlalchemy import Date, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.mixins import IdMixin, TimestampMixin


class EventStatus(str, enum.Enum):
    draft = "rascunho"
    reserved = "reservado"
    in_progress = "em_andamento"
    completed = "concluido"
    canceled = "cancelado"


class Event(IdMixin, TimestampMixin, Base):
    __tablename__ = "events"

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("companies.id"), index=True
    )
    venue_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("venues.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    client_name: Mapped[str | None] = mapped_column(String(160))
    starts_on: Mapped[date | None] = mapped_column(Date)
    ends_on: Mapped[date | None] = mapped_column(Date)
    status: Mapped[EventStatus] = mapped_column(
        Enum(EventStatus), default=EventStatus.draft, index=True
    )
    logistics_notes: Mapped[str | None] = mapped_column(Text)
