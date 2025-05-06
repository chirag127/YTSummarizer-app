"""
Tests for the video service.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import os
import re

from app.services.video_service import (
    is_valid_youtube_url,
    extract_video_id,
    get_random_user_password_rotate,
    extract_video_info
)

# Test is_valid_youtube_url function
@pytest.mark.parametrize("url,expected", [
    ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", True),
    ("https://youtu.be/dQw4w9WgXcQ", True),
    ("https://m.youtube.com/watch?v=dQw4w9WgXcQ", True),
    ("https://youtube.com/live/dQw4w9WgXcQ", True),
    ("https://example.com", False),
    ("", False),
    (None, False),
])
def test_is_valid_youtube_url(url, expected):
    """Test the is_valid_youtube_url function with various URLs."""
    assert is_valid_youtube_url(url) == expected

# Test extract_video_id function
@pytest.mark.parametrize("url,expected", [
    ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    ("https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    ("https://youtu.be/dQw4w9WgXcQ?si=parameter", "dQw4w9WgXcQ"),
    ("https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    ("https://youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
    ("https://example.com", None),
    ("", None),
])
def test_extract_video_id(url, expected):
    """Test the extract_video_id function with various URLs."""
    assert extract_video_id(url) == expected

# Test get_random_user_password_rotate function
def test_get_random_user_password_rotate():
    """Test the get_random_user_password_rotate function returns a string."""
    # Mock environment variables
    with patch.dict(os.environ, {
        "USER_PASS_ROTATE1": "user1:pass1",
        "USER_PASS_ROTATE2": "user2:pass2",
    }):
        result = get_random_user_password_rotate()
        assert isinstance(result, str)
        assert result in ["user1:pass1", "user2:pass2"]

# Test extract_video_info function
@pytest.mark.asyncio
async def test_extract_video_info_cached(mock_redis):
    """Test extract_video_info returns cached data if available."""
    # Set up mock cached data
    cached_data = {
        "title": "Cached Video",
        "thumbnail": "https://example.com/cached_thumbnail.jpg",
        "transcript": "This is a cached transcript.",
        "transcript_language": "en"
    }
    mock_redis.get.return_value = '{"title": "Cached Video", "thumbnail": "https://example.com/cached_thumbnail.jpg", "transcript": "This is a cached transcript.", "transcript_language": "en"}'
    
    # Call the function
    with patch("app.utils.cache.get_cached_video_info") as mock_get_cached_video_info:
        mock_get_cached_video_info.return_value = cached_data
        result = await extract_video_info("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    
    # Verify the result
    assert result["title"] == "Cached Video"
    assert result["transcript"] == "This is a cached transcript."
    assert result["transcript_language"] == "en"

@pytest.mark.asyncio
async def test_extract_video_info_not_cached(mock_redis, mock_yt_dlp, mock_requests):
    """Test extract_video_info extracts data if not cached."""
    # Set up mock Redis to return None (no cached data)
    mock_redis.get.return_value = None
    
    # Set up mock cache functions
    with patch("app.utils.cache.get_cached_video_info") as mock_get_cached_video_info, \
         patch("app.utils.cache.get_cached_transcript") as mock_get_cached_transcript, \
         patch("app.utils.cache.cache_video_info") as mock_cache_video_info, \
         patch("app.utils.cache.cache_transcript") as mock_cache_transcript, \
         patch("app.utils.cache.cache_available_languages") as mock_cache_available_languages, \
         patch("os.path.exists", return_value=True), \
         patch("builtins.open", MagicMock()), \
         patch("os.remove", MagicMock()):
        
        # Configure mocks
        mock_get_cached_video_info.return_value = None
        mock_get_cached_transcript.return_value = None
        mock_cache_video_info.return_value = True
        mock_cache_transcript.return_value = True
        mock_cache_available_languages.return_value = True
        
        # Call the function
        result = await extract_video_info("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    
    # Verify the result
    assert result["title"] == "Test Video"
    assert result["thumbnail"] == "https://example.com/thumbnail.jpg"

@pytest.mark.asyncio
async def test_extract_video_info_invalid_url():
    """Test extract_video_info with an invalid URL."""
    with patch("app.services.video_service.extract_video_id") as mock_extract_video_id:
        mock_extract_video_id.return_value = None
        result = await extract_video_info("https://example.com")
    
    assert result["title"] == "Title Unavailable"
    assert result["thumbnail"] is None
    assert result["transcript"] is None
    assert "error" in result
