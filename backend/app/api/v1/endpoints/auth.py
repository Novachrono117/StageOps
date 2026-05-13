from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser
from app.core.security import create_access_token
from app.db.session import get_db
from app.schemas.domain import UserRead
from app.services.users import user_service

router = APIRouter()


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> Token:
    user = user_service.authenticate(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha invalidos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return Token(access_token=create_access_token(user.email))


@router.get("/me", response_model=UserRead)
def me(current_user: CurrentUser) -> CurrentUser:
    return current_user
