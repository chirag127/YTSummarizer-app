"""
Tests for the cache API routes.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock

@pytest.mark.asyncio
async def test_clear_cache(test_client):
    """Test clearing all cache."""
    # Set up mock
    with patch("app.utils.cache.clear_cache") as mock_clear_cache:
        mock_clear_cache.return_value = True
        
        # Make the request
        response = test_client.delete("/cache/")
        
        # Verify the response
        assert response.status_code == 200
        assert response.json()["message"] == "Cache cleared successfully"

@pytest.mark.asyncio
async def test_clear_video_cache(test_client):
    """Test clearing cache for a specific video."""
    # Set up mocks
    with patch("app.utils.cache.delete_cache") as mock_delete_cache:
        mock_delete_cache.return_value = True
        
        # Make the request
        response = test_client.delete("/cache/video/dQw4w9WgXcQ")
        
        # Verify the response
        assert response.status_code == 200
        assert response.json()["message"] == "Cache for video dQw4w9WgXcQ cleared successfully"

@pytest.mark.asyncio
async def test_get_cache_status(test_client):
    """Test getting cache status."""
    # Set up mock
    with patch("app.utils.cache.get_cache_stats") as mock_get_cache_stats:
        mock_get_cache_stats.return_value = {
            "status": "Connected",
            "used_memory_human": "1K",
            "maxmemory_human": "10K",
            "memory_percent": "10.00%",
            "total_keys": 5,
            "transcript_keys": 2,
            "video_info_keys": 1,
            "summary_keys": 2
        }
        
        # Make the request
        response = test_client.get("/cache/status")
        
        # Verify the response
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Connected"
        assert data["used_memory_human"] == "1K"
        assert data["maxmemory_human"] == "10K"
        assert data["memory_percent"] == "10.00%"
        assert data["total_keys"] == 5
        assert data["transcript_keys"] == 2
        assert data["video_info_keys"] == 1
        assert data["summary_keys"] == 2
