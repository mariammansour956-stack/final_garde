from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./notifications.db"
    secret_key: str = "same-secret-key-as-user-service"
    algorithm: str = "HS256"
    service_name: str = "notification-service"
    log_level: str = "INFO"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
