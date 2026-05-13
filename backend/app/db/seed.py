from sqlalchemy import select

from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.company import Company
from app.models.people import User, UserRole
from app.models.stage import StageDeck


def seed() -> None:
    db = SessionLocal()
    try:
        company = db.scalar(select(Company).where(Company.name == "StageOps Demo"))
        if not company:
            company = Company(name="StageOps Demo", email="admin@stageops.local")
            db.add(company)
            db.flush()

        user = db.scalar(select(User).where(User.email == "admin@stageops.local"))
        if not user:
            db.add(
                User(
                    company_id=company.id,
                    name="Administrador",
                    email="admin@stageops.local",
                    hashed_password=get_password_hash("stageops123"),
                    role=UserRole.admin,
                    is_active=True,
                )
            )

        default_decks = [
            ("Placa 2m x 1m", 2.0, 1.0),
            ("Placa 1m x 1m", 1.0, 1.0),
            ("Placa 2m x 0.5m", 2.0, 0.5),
        ]
        for name, width_m, length_m in default_decks:
            exists = db.scalar(
                select(StageDeck).where(
                    StageDeck.company_id == company.id, StageDeck.name == name
                )
            )
            if not exists:
                db.add(
                    StageDeck(
                        company_id=company.id,
                        name=name,
                        width_m=width_m,
                        length_m=length_m,
                        available_quantity=0,
                        legs_per_deck=4,
                        legs_per_height=4,
                    )
                )

        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
