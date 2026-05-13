import enum
from uuid import UUID

from sqlalchemy import Enum, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.mixins import IdMixin, TimestampMixin


class ChecklistDirection(str, enum.Enum):
    outbound = "saida"
    inbound = "retorno"


class ChecklistItemStatus(str, enum.Enum):
    pending = "pendente"
    ok = "ok"
    missing = "faltando"
    damaged = "danificado"


class EventChecklist(IdMixin, TimestampMixin, Base):
    __tablename__ = "event_checklists"

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("companies.id"), index=True
    )
    event_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("events.id"), index=True
    )
    direction: Mapped[ChecklistDirection] = mapped_column(
        Enum(ChecklistDirection), index=True
    )
    responsible_user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    notes: Mapped[str | None] = mapped_column(Text)


class EventChecklistItem(IdMixin, TimestampMixin, Base):
    __tablename__ = "event_checklist_items"

    checklist_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("event_checklists.id"), index=True
    )
    equipment_unit_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("equipment_units.id"), index=True
    )
    equipment_model_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("equipment_models.id"), index=True
    )
    expected_quantity: Mapped[int] = mapped_column(Integer, default=1)
    checked_quantity: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[ChecklistItemStatus] = mapped_column(
        Enum(ChecklistItemStatus), default=ChecklistItemStatus.pending
    )
    notes: Mapped[str | None] = mapped_column(Text)
