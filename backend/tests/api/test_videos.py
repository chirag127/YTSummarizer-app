"""
Tests for the videos API routes.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock

@pytest.mark.asyncio
async def test_validate_url_valid(test_client):
    """Test validating a valid YouTube URL."""
    # Set up mock services
    with patch("app.services.video_service.is_valid_youtube_url") as mock_is_valid_youtube_url, \
         patch("app.services.video_service.extract_video_info") as mock_extract_video_info:
        
        # Configure mocks
        mock_is_valid_youtube_url.return_value = True
        mock_extract_video_info.return_value = {
            "title": "Test Video",
            "thumbnail": "https://example.com/thumbnail.jpg",
            "transcript": "This is a test transcript.",
            "transcript_language": "en"
        }
        
        # Make the request
        response = test_client.post(
            "/api/v1/validate-url",
            json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
        )
        
        # Verify the response
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert data["has_transcript"] is True
        assert data["video_title"] == "Test Video"
        assert data["video_thumbnail_url"] == "https://example.com/thumbnail.jpg"

@pytest.mark.asyncio
async def test_validate_url_invalid(test_client):
    """Test validating an invalid URL."""
    # Set up mock service
    with patch("app.services.video_service.is_valid_youtube_url") as mock_is_valid_youtube_url:
        mock_is_valid_youtube_url.return_value = False
        
        # Make the request
        response = test_client.post(
            "/api/v1/validate-url",
            json={"url": "https://example.com"}
        )
        
        # Verify the response
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is False
        assert data["has_transcript"] is False

@pytest.mark.asyncio
async def test_validate_url_no_transcript(test_client):
    """Test validating a URL with no transcript."""
    # Set up mock services
    with patch("app.services.video_service.is_valid_youtube_url") as mock_is_valid_youtube_url, \
         patch("app.services.video_service.extract_video_info") as mock_extract_video_info:
        
        # Configure mocks
        mock_is_valid_youtube_url.return_value = True
        mock_extract_video_info.return_value = {
            "title": "Test Video",
            "thumbnail": "https://example.com/thumbnail.jpg",
            "transcript": None,
            "transcript_language": None
        }
        
        # Make the request
        response = test_client.post(
            "/api/v1/validate-url",
            json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
        )
        
        # Verify the response
        assert response.status_code == 200
        data = response.json()
        assert data["is_valid"] is True
        assert data["has_transcript"] is False
        assert data["video_title"] == "Test Video"
        assert data["video_thumbnail_url"] == "https://example.com/thumbnail.jpg"
