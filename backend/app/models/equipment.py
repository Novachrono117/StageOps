import enum
from uuid import UUID

from sqlalchemy import Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.mixins import IdMixin, TimestampMixin


class EquipmentUnitStatus(str, enum.Enum):
    available = "disponivel"
    in_event = "em_evento"
    reserved = "reservado"
    maintenance = "em_manutencao"
    rented = "locado"
    lost = "perdido"


class LocationType(str, enum.Enum):
    warehouse = "galpao"
    event = "evento"
    third_party = "empresa_terceira"
    maintenance = "manutencao"


class EquipmentCategory(IdMixin, TimestampMixin, Base):
    __tablename__ = "equipment_categories"

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("companies.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)


class EquipmentModel(IdMixin, TimestampMixin, Base):
    __tablename__ = "equipment_models"

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("companies.id"), index=True
    )
    category_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("equipment_categories.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(140), nullable=False)
    manufacturer: Mapped[str | None] = mapped_column(String(120))
    technical_specs: Mapped[str | None] = mapped_column(Text)
    weight_kg: Mapped[float | None] = mapped_column(Numeric(10, 2))


class EquipmentUnit(IdMixin, TimestampMixin, Base):
    __tablename__ = "equipment_units"

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("companies.id"), index=True
    )
    model_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("equipment_models.id"), index=True
    )
    asset_tag: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    serial_number: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[EquipmentUnitStatus] = mapped_column(
        Enum(EquipmentUnitStatus), default=EquipmentUnitStatus.available, index=True
    )
    location_type: Mapped[LocationType] = mapped_column(
        Enum(LocationType), default=LocationType.warehouse, index=True
    )
    warehouse_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("warehouses.id"), index=True
    )
    internal_location_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("internal_locations.id"), index=True
    )
    current_event_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("events.id"), index=True
    )
    third_party_company: Mapped[str | None] = mapped_column(String(160))
    notes: Mapped[str | None] = mapped_column(Text)
