from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "StageOps"
    API_V1_PREFIX: str = "/api/v1"
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://stageops:stageops@db:5432/stageops"
    )
    SECRET_KEY: str = "change-this-secret-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8
    CORS_ORIGINS: list[AnyHttpUrl | str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
