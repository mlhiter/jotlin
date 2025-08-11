from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from dotenv import load_dotenv
from pathlib import Path

# Get the directory of this file
current_dir = Path(__file__).parent.parent.parent  # Go up to FastAPI root
env_path = current_dir / ".env"

# Load environment variables from .env file
load_dotenv(dotenv_path=env_path)


class Settings(BaseSettings):
    # Database Configuration
    database_url: Optional[str] = "sqlite:///./test.db"

    # OpenAI Configuration
    openai_api_key: Optional[str] = None
    openai_base_url: str = "https://api.openai.com/v1"

    # CORS Configuration
    cors_origins: str = "http://localhost:3001"

    # Security Configuration
    secret_key: str = "your-secret-key-here-please-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    environment: str = "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated CORS origins to list"""
        if isinstance(self.cors_origins, str):
            return [origin.strip() for origin in self.cors_origins.split(",")]
        return self.cors_origins

    def log_config(self):
        """Log configuration status for debugging"""
        print(f"🔧 Configuration loaded:")
        print(f"   - .env file path: {env_path}")
        print(f"   - .env file exists: {'✅' if env_path.exists() else '❌'}")
        print(f"   - Database URL: {'✅ PostgreSQL' if self.database_url and 'postgresql' in self.database_url else '⚠ SQLite default'}")
        print(f"   - OpenAI API Key: {'✅ Set' if self.openai_api_key else '❌ Missing'}")
        print(f"   - OpenAI Base URL: {self.openai_base_url}")
        print(f"   - CORS Origins: {self.cors_origins_list}")
        print(f"   - Environment: {self.environment}")


# Create settings instance
settings = Settings()

# Log configuration on startup (optional, for debugging)
if os.getenv("DEBUG_CONFIG", "false").lower() == "true":
    settings.log_config()