"""
Test configuration and fixtures for the YouTube Summarizer backend.
"""

import asyncio
import pytest
from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient
from unittest.mock import AsyncMock, MagicMock, patch

from app.main import app
from app.config import settings
from app.db.mongodb import get_database

# Override settings for testing
settings.database.MONGODB_URI = "mongodb://localhost:27017"
settings.database.DATABASE_NAME = "test_youtube_summarizer"
settings.cache.REDIS_URL = "redis://localhost:6379/1"  # Use a different Redis database for testing

@pytest.fixture
def test_client():
    """Return a FastAPI TestClient which uses the test database."""
    with TestClient(app) as client:
        yield client

@pytest.fixture
async def mock_mongodb():
    """Mock MongoDB client and database."""
    # Create a mock MongoDB client
    mock_client = AsyncMock(spec=AsyncIOMotorClient)
    
    # Create a mock database
    mock_db = AsyncMock()
    
    # Create mock collections
    mock_summaries = AsyncMock()
    mock_video_chats = AsyncMock()
    
    # Set up the mock database structure
    mock_db.summaries = mock_summaries
    mock_db.video_chats = mock_video_chats
    
    # Set up the mock client to return the mock database
    mock_client.__getitem__.return_value = mock_db
    
    # Patch the get_database function to return our mock database
    with patch("app.db.mongodb.get_database", return_value=mock_db):
        yield mock_db

@pytest.fixture
async def mock_redis():
    """Mock Redis client."""
    mock_redis_client = AsyncMock()
    
    # Set up common Redis methods
    mock_redis_client.get.return_value = None
    mock_redis_client.set.return_value = True
    mock_redis_client.delete.return_value = True
    mock_redis_client.keys.return_value = []
    mock_redis_client.info.return_value = {"used_memory": 1000, "maxmemory": 10000}
    
    # Patch the Redis client in the cache module
    with patch("app.utils.cache.redis_client", mock_redis_client):
        yield mock_redis_client

@pytest.fixture
async def mock_gemini():
    """Mock Gemini AI client."""
    mock_client = MagicMock()
    mock_model = MagicMock()
    mock_response = MagicMock()
    
    # Set up the mock response
    mock_response.text = "This is a mock summary."
    
    # Set up the mock model to return the mock response
    mock_model.generate_content.return_value = mock_response
    
    # Set up the mock client to return the mock model
    mock_client.models = MagicMock()
    mock_client.models.generate_content = mock_model.generate_content
    
    # Patch the Gemini client in the AI service module
    with patch("google.genai.Client", return_value=mock_client):
        yield mock_client

@pytest.fixture
async def mock_yt_dlp():
    """Mock yt-dlp for extracting video information."""
    mock_ydl = MagicMock()
    mock_info = {
        "title": "Test Video",
        "thumbnail": "https://example.com/thumbnail.jpg",
        "subtitles": {
            "en": [
                {
                    "ext": "vtt",
                    "url": "https://example.com/subtitles.vtt"
                }
            ]
        },
        "automatic_captions": {
            "en": [
                {
                    "ext": "vtt",
                    "url": "https://example.com/auto_captions.vtt"
                }
            ]
        }
    }
    
    # Set up the mock yt-dlp to return the mock info
    mock_ydl.extract_info.return_value = mock_info
    
    # Patch the yt-dlp YoutubeDL class
    with patch("yt_dlp.YoutubeDL", return_value=mock_ydl):
        yield mock_ydl

@pytest.fixture
async def mock_requests():
    """Mock requests for HTTP requests."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = "WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nThis is a test transcript."
    
    # Patch the requests.get method
    with patch("requests.get", return_value=mock_response):
        yield mock_response
