"""
Configuration module for the YouTube Summarizer backend.

This module loads environment variables and provides configuration settings
for the application.
"""

import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseSettings:
    """Database configuration settings."""
    MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "youtube_summarizer")

class AISettings:
    """AI configuration settings."""
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set. Summarization will not work.")

class CacheSettings:
    """Cache configuration settings."""
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
    MAX_MEMORY_PERCENT = float(os.getenv("MAX_MEMORY_PERCENT", 90.0))
    MAX_CACHE_KEYS = int(os.getenv("MAX_CACHE_KEYS", 10000))

class Settings:
    """Application settings."""
    database = DatabaseSettings()
    ai = AISettings()
    cache = CacheSettings()
    
    # API settings
    API_TITLE = "YouTube Summarizer API"
    
    # CORS settings
    CORS_ORIGINS = ["*"]  # In production, replace with specific origins
    CORS_CREDENTIALS = True
    CORS_METHODS = ["*"]
    CORS_HEADERS = ["*"]

# Create a global settings instance
settings = Settings()
