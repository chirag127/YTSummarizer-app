"""
Tests for the chat API routes.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from bson import ObjectId
from datetime import datetime, timezone

@pytest.mark.asyncio
async def test_ask_question(test_client, mock_mongodb):
    """Test asking a question about a video."""
    # Set up mock services
    with patch("app.services.video_service.extract_video_info") as mock_extract_video_info, \
         patch("app.services.video_service.extract_video_id") as mock_extract_video_id, \
         patch("app.services.ai_service.generate_qa_response") as mock_generate_qa_response:
        
        # Configure mocks
        mock_extract_video_id.return_value = "dQw4w9WgXcQ"
        mock_extract_video_info.return_value = {
            "title": "Test Video",
            "thumbnail": "https://example.com/thumbnail.jpg",
            "transcript": "This is a test transcript.",
            "transcript_language": "en"
        }
        mock_generate_qa_response.return_value = "This is a test answer."
        
        # Configure MongoDB mock
        mock_mongodb.video_chats.find_one.return_value = None
        mock_mongodb.video_chats.insert_one.return_value = MagicMock(inserted_id=ObjectId("60f1e5b5e5d8e3b3e8b0e1a1"))
        
        # Make the request
        response = test_client.post(
            "/api/v1/ask",
            json={
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "question": "What is the video about?",
                "history": []
            }
        )
        
        # Verify the response
        assert response.status_code == 200
        data = response.json()
        assert data["answer"] == "This is a test answer."
        assert data["video_id"] == "dQw4w9WgXcQ"

@pytest.mark.asyncio
async def test_ask_question_no_transcript(test_client):
    """Test asking a question about a video with no transcript."""
    # Set up mock services
    with patch("app.services.video_service.extract_video_info") as mock_extract_video_info, \
         patch("app.services.video_service.extract_video_id") as mock_extract_video_id:
        
        # Configure mocks
        mock_extract_video_id.return_value = "dQw4w9WgXcQ"
        mock_extract_video_info.return_value = {
            "title": "Test Video",
            "thumbnail": "https://example.com/thumbnail.jpg",
            "transcript": None,
            "transcript_language": None
        }
        
        # Make the request
        response = test_client.post(
            "/api/v1/ask",
            json={
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "question": "What is the video about?",
                "history": []
            }
        )
        
        # Verify the response
        assert response.status_code == 400
        assert "No transcript available" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_chat_history(test_client, mock_mongodb):
    """Test getting chat history for a video."""
    # Set up mock database response
    mock_chat = {
        "_id": ObjectId("60f1e5b5e5d8e3b3e8b0e1a1"),
        "video_id": "dQw4w9WgXcQ",
        "video_title": "Test Video",
        "video_thumbnail_url": "https://example.com/thumbnail.jpg",
        "messages": [
            {
                "role": "user",
                "content": "What is the video about?",
                "timestamp": datetime.now(timezone.utc)
            },
            {
                "role": "model",
                "content": "This is a test answer.",
                "timestamp": datetime.now(timezone.utc)
            }
        ],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Configure the mock to return the chat
    mock_mongodb.video_chats.find_one.return_value = mock_chat
    
    # Make the request
    response = test_client.get("/api/v1/chat-history/dQw4w9WgXcQ")
    
    # Verify the response
    assert response.status_code == 200
    data = response.json()
    assert data["video_id"] == "dQw4w9WgXcQ"
    assert data["video_title"] == "Test Video"
    assert len(data["messages"]) == 2
    assert data["messages"][0]["role"] == "user"
    assert data["messages"][0]["content"] == "What is the video about?"
    assert data["messages"][1]["role"] == "model"
    assert data["messages"][1]["content"] == "This is a test answer."
