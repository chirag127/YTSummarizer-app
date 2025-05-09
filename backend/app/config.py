"""
Configuration module for the YouTube Summarizer backend.

This module loads environment variables and sets up configuration constants
used throughout the application.
"""

import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection settings
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "youtube_summarizer")

# Gemini API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not set. Summarization will not work.")

# Redis cache configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
MAX_MEMORY_PERCENT = float(os.getenv("MAX_MEMORY_PERCENT", 90.0))
MAX_CACHE_KEYS = int(os.getenv("MAX_CACHE_KEYS", 10000))
