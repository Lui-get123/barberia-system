import os

from pydantic_settings import BaseSettings, SettingsConfigDict


def _default_database_url() -> str:
    # Prefer Fly.io persistent volume when available
    if os.path.isdir("/data"):
        return "sqlite:////data/barberia.db"
    return "sqlite:///./barberia.db"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = _default_database_url()
    secret_key: str = "change-this-in-production-please-use-a-secure-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week
    cors_origins: str = "*"

    seed_admin_email: str = "admin@barberia.com"
    seed_admin_password: str = "admin123"
    seed_admin_name: str = "Administrador"


settings = Settings()
