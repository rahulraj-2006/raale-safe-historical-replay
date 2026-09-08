import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "RAALE – Safe Historical Replay Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Path settings
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    DB_PATH: Path = DATA_DIR / "raale.db"
    
    # SQLite URL
    DATABASE_URL: str = f"sqlite:///{DB_PATH.as_posix()}"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

    class Config:
        extra = "ignore"

settings = Settings()

# Ensure data directory exists
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
