from sqlalchemy import Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from uuid import UUID
from sqlalchemy import ForeignKey

from app.db.session import Base
from app.models.mixins import IdMixin, TimestampMixin


class StageDeck(IdMixin, TimestampMixin, Base):
    __tablename__ = "stage_decks"

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("companies.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    width_m: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    length_m: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    available_quantity: Mapped[int] = mapped_column(Integer, default=0)
    legs_per_deck: Mapped[int] = mapped_column(Integer, default=4)
    legs_per_height: Mapped[int] = mapped_column(Integer, default=4)

    @property
    def area_m2(self) -> float:
        return float(self.width_m * self.length_m)

    def total_area(self, quantity: int | None = None) -> float:
        return self.area_m2 * float(quantity or self.available_quantity)

    def required_legs(self, quantity: int | None = None) -> int:
        return (quantity or self.available_quantity) * self.legs_per_deck

    @property
    def total_available_area_m2(self) -> float:
        return self.total_area()

    @property
    def required_legs_for_available_quantity(self) -> int:
        return self.required_legs()


class StageStair(IdMixin, TimestampMixin, Base):
    __tablename__ = "stage_stairs"

    company_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("companies.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    compatible_height_cm: Mapped[int] = mapped_column(Integer, nullable=False)
    available_quantity: Mapped[int] = mapped_column(Integer, default=0)


class StageDeckStairCompatibility(IdMixin, TimestampMixin, Base):
    __tablename__ = "stage_deck_stair_compatibilities"
    __table_args__ = (
        UniqueConstraint("deck_id", "stair_id", name="uq_stage_deck_stair"),
    )

    deck_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("stage_decks.id"), index=True
    )
    stair_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("stage_stairs.id"), index=True
    )
