import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    google_genai_use_vertexai: int = int(os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "0"))
    dashboard_webhook_url: str = os.getenv("DASHBOARD_WEBHOOK_URL", "http://localhost:3000/api/webhook")

    # Models config
    judge_model: str = os.getenv("JUDGE_MODEL", "gemini-2.5-pro")
    pipeline_model: str = os.getenv("PIPELINE_MODEL", "gemini-2.5-flash-lite")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
