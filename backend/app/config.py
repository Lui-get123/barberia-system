from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./barberia.db"
    secret_key: str = "change-this-in-production-please-use-a-secure-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 1 week
    cors_origins: str = "*"

    seed_admin_email: str = "admin@barberia.com"
    seed_admin_password: str = "admin123"
    seed_admin_name: str = "Administrador"


settings = Settings()
