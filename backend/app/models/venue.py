from uuid import UUID

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.mixins import IdMixin, TimestampMixin


class Venue(IdMixin, TimestampMixin, Base):
    __tablename__ = "venues"

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("companies.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    address: Mapped[str | None] = mapped_column(String(255))
    access_difficulty: Mapped[str | None] = mapped_column(Text)
    internal_notes: Mapped[str | None] = mapped_column(Text)
    internal_rating: Mapped[int | None] = mapped_column(Integer)


class VenueOperationalNote(IdMixin, TimestampMixin, Base):
    __tablename__ = "venue_operational_notes"

    venue_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("venues.id"), index=True
    )
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)


class VenueEpiRequirement(IdMixin, TimestampMixin, Base):
    __tablename__ = "venue_epi_requirements"

    venue_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("venues.id"), index=True
    )
    epi_name: Mapped[str] = mapped_column(String(120), nullable=False)
    is_required: Mapped[bool] = mapped_column(default=True)
    notes: Mapped[str | None] = mapped_column(Text)
