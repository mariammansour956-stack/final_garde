from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./orders.db"
    secret_key: str = "same-secret-key-as-user-service"
    algorithm: str = "HS256"
    notification_service_url: str = "http://notification-service:8003"
    service_name: str = "order-service"
    log_level: str = "INFO"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
