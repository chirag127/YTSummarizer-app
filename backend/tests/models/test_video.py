"""
Tests for the video models.
"""

import pytest
from pydantic import ValidationError

from app.models.video import YouTubeURL, VideoInfo, VideoValidationResponse

def test_youtube_url_model():
    """Test the YouTubeURL model."""
    # Valid URL
    url = YouTubeURL(url="https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    assert url.url == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    
    # Empty URL
    with pytest.raises(ValidationError):
        YouTubeURL(url="")

def test_video_info_model():
    """Test the VideoInfo model."""
    # Complete info
    info = VideoInfo(
        title="Test Video",
        thumbnail="https://example.com/thumbnail.jpg",
        transcript="This is a test transcript.",
        transcript_language="en"
    )
    assert info.title == "Test Video"
    assert info.thumbnail == "https://example.com/thumbnail.jpg"
    assert info.transcript == "This is a test transcript."
    assert info.transcript_language == "en"
    assert info.error is None
    
    # Minimal info
    info = VideoInfo(title="Test Video")
    assert info.title == "Test Video"
    assert info.thumbnail is None
    assert info.transcript is None
    assert info.transcript_language is None
    assert info.error is None
    
    # With error
    info = VideoInfo(
        title="Test Video",
        error="Test error"
    )
    assert info.title == "Test Video"
    assert info.error == "Test error"

def test_video_validation_response_model():
    """Test the VideoValidationResponse model."""
    # Valid video with transcript
    response = VideoValidationResponse(
        url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        is_valid=True,
        has_transcript=True,
        video_title="Test Video",
        video_thumbnail_url="https://example.com/thumbnail.jpg"
    )
    assert response.url == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert response.is_valid is True
    assert response.has_transcript is True
    assert response.video_title == "Test Video"
    assert response.video_thumbnail_url == "https://example.com/thumbnail.jpg"
    assert response.error is None
    
    # Invalid video
    response = VideoValidationResponse(
        url="https://example.com",
        is_valid=False,
        has_transcript=False
    )
    assert response.url == "https://example.com"
    assert response.is_valid is False
    assert response.has_transcript is False
    assert response.video_title is None
    assert response.video_thumbnail_url is None
    assert response.error is None
    
    # Valid video with error
    response = VideoValidationResponse(
        url="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        is_valid=True,
        has_transcript=False,
        error="No transcript available"
    )
    assert response.url == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert response.is_valid is True
    assert response.has_transcript is False
    assert response.error == "No transcript available"
