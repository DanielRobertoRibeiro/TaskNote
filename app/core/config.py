from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TaskNote"
    app_version: str = "1.0.0"
    environment: str = "development"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+psycopg://tasknote:tasknote@localhost:5432/tasknote"

    secret_key: str = Field(
        default="development-only-secret-key-change-me",
        min_length=32,
    )
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=60, ge=1, le=10080)

    pagination_default_size: int = Field(default=20, ge=1, le=100)
    pagination_max_size: int = Field(default=100, ge=1, le=500)
    cors_origins: list[str] = Field(default_factory=list)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @model_validator(mode="after")
    def reject_default_secret_outside_development(self) -> "Settings":
        if (
            self.environment.casefold() not in {"development", "test"}
            and self.secret_key == "development-only-secret-key-change-me"
        ):
            raise ValueError("SECRET_KEY deve ser alterada fora do ambiente de desenvolvimento.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
