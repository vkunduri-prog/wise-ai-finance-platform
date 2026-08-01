from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        protected_namespaces=("settings_",),
    )

    app_name: str = "FinPilot API"
    app_version: str = "0.1.0"
    app_env: str = "development"

    database_url: str = "mysql+pymysql://finpilot:finpilot@localhost:3306/finpilot"
    model_path: str = "app/ml_artifacts/recommender.joblib"

    frontend_origin: str = "http://localhost:3000"
    frontend_origin_alt: str = "http://127.0.0.1:3000"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    auth_salt: str = "change-this-in-production"

    @property
    def cors_origins_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


settings = Settings()
