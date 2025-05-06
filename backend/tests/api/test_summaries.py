"""
Tests for the summaries API routes.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from bson import ObjectId
from datetime import datetime, timezone

@pytest.mark.asyncio
async def test_create_summary(test_client, mock_mongodb):
    """Test creating a summary."""
    # Set up mock database response
    mock_mongodb.summaries.find_one.return_value = None
    mock_mongodb.summaries.insert_one.return_value = MagicMock(inserted_id=ObjectId("60f1e5b5e5d8e3b3e8b0e1a1"))
    
    # Set up mock services
    with patch("app.services.video_service.extract_video_info") as mock_extract_video_info, \
         patch("app.services.video_service.is_valid_youtube_url") as mock_is_valid_youtube_url, \
         patch("app.services.ai_service.generate_summary") as mock_generate_summary:
        
        # Configure mocks
        mock_is_valid_youtube_url.return_value = True
        mock_extract_video_info.return_value = {
            "title": "Test Video",
            "thumbnail": "https://example.com/thumbnail.jpg",
            "transcript": "This is a test transcript.",
            "transcript_language": "en"
        }
        mock_generate_summary.return_value = "This is a test summary."
        
        # Make the request
        response = test_client.post(
            "/summaries/",
            json={
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "summary_type": "Brief",
                "summary_length": "Short"
            }
        )
        
        # Verify the response
        assert response.status_code == 200
        data = response.json()
        assert data["video_url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        assert data["summary_type"] == "Brief"
        assert data["summary_length"] == "Short"

@pytest.mark.asyncio
async def test_get_summaries(test_client, mock_mongodb):
    """Test getting all summaries."""
    # Set up mock database response
    mock_summaries = [
        {
            "_id": ObjectId("60f1e5b5e5d8e3b3e8b0e1a1"),
            "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "video_title": "Test Video 1",
            "video_thumbnail_url": "https://example.com/thumbnail1.jpg",
            "summary_text": "This is test summary 1.",
            "summary_type": "Brief",
            "summary_length": "Short",
            "transcript_language": "en",
            "is_starred": False,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        },
        {
            "_id": ObjectId("60f1e5b5e5d8e3b3e8b0e1a2"),
            "video_url": "https://www.youtube.com/watch?v=abcdefghijk",
            "video_title": "Test Video 2",
            "video_thumbnail_url": "https://example.com/thumbnail2.jpg",
            "summary_text": "This is test summary 2.",
            "summary_type": "Detailed",
            "summary_length": "Medium",
            "transcript_language": "en",
            "is_starred": True,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
    ]
    
    # Configure the mock to return the summaries
    mock_cursor = AsyncMock()
    mock_cursor.__aiter__.return_value = mock_summaries
    mock_mongodb.summaries.find.return_value = mock_cursor
    
    # Make the request
    response = test_client.get("/summaries/")
    
    # Verify the response
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["video_title"] == "Test Video 1"
    assert data[1]["video_title"] == "Test Video 2"
