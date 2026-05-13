from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.mixins import IdMixin, TimestampMixin


class Company(IdMixin, TimestampMixin, Base):
    __tablename__ = "companies"

    name: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    legal_name: Mapped[str | None] = mapped_column(String(180))
    tax_id: Mapped[str | None] = mapped_column(String(32), unique=True)
    phone: Mapped[str | None] = mapped_column(String(32))
    email: Mapped[str | None] = mapped_column(String(160))

    users = relationship("User", back_populates="company")
    employees = relationship("Employee", back_populates="company")
