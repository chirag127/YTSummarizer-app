"""
Tests for the cache utilities.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import json
from datetime import datetime, timezone

from app.utils.cache import (
    init_redis,
    close_redis,
    set_cache,
    get_cache,
    delete_cache,
    clear_cache,
    cache_transcript,
    get_cached_transcript,
    cache_video_info,
    get_cached_video_info,
    cache_summary_result,
    get_cached_summary,
    get_cache_stats
)

@pytest.mark.asyncio
async def test_init_redis(mock_redis):
    """Test initializing Redis connection."""
    with patch("app.utils.cache.redis.from_url", return_value=mock_redis):
        result = await init_redis()
        assert result is mock_redis

@pytest.mark.asyncio
async def test_close_redis(mock_redis):
    """Test closing Redis connection."""
    with patch("app.utils.cache.redis_client", mock_redis):
        await close_redis()
        mock_redis.close.assert_called_once()

@pytest.mark.asyncio
async def test_set_cache(mock_redis):
    """Test setting a value in the cache."""
    # Call the function
    with patch("app.utils.cache.redis_client", mock_redis):
        result = await set_cache("test_key", {"test": "value"})
    
    # Verify the result
    assert result is True
    mock_redis.set.assert_called_once()

@pytest.mark.asyncio
async def test_get_cache_hit(mock_redis):
    """Test getting a value from the cache (cache hit)."""
    # Set up mock
    mock_redis.get.return_value = '{"test": "value"}'
    
    # Call the function
    with patch("app.utils.cache.redis_client", mock_redis):
        result = await get_cache("test_key")
    
    # Verify the result
    assert result == {"test": "value"}
    mock_redis.get.assert_called_once_with("test_key")

@pytest.mark.asyncio
async def test_get_cache_miss(mock_redis):
    """Test getting a value from the cache (cache miss)."""
    # Set up mock
    mock_redis.get.return_value = None
    
    # Call the function
    with patch("app.utils.cache.redis_client", mock_redis):
        result = await get_cache("test_key")
    
    # Verify the result
    assert result is None
    mock_redis.get.assert_called_once_with("test_key")

@pytest.mark.asyncio
async def test_delete_cache(mock_redis):
    """Test deleting a value from the cache."""
    # Call the function
    with patch("app.utils.cache.redis_client", mock_redis):
        result = await delete_cache("test_key")
    
    # Verify the result
    assert result is True
    mock_redis.delete.assert_called_once_with("test_key")

@pytest.mark.asyncio
async def test_clear_cache(mock_redis):
    """Test clearing all cache."""
    # Call the function
    with patch("app.utils.cache.redis_client", mock_redis):
        result = await clear_cache()
    
    # Verify the result
    assert result is True
    mock_redis.flushdb.assert_called_once()

@pytest.mark.asyncio
async def test_cache_transcript():
    """Test caching a transcript."""
    # Set up mock
    with patch("app.utils.cache.set_cache") as mock_set_cache:
        mock_set_cache.return_value = True
        
        # Call the function
        result = await cache_transcript("video_id", {"transcript": "Test transcript", "language": "en"})
        
        # Verify the result
        assert result is True
        mock_set_cache.assert_called_once_with("transcript:video_id", {"transcript": "Test transcript", "language": "en"})

@pytest.mark.asyncio
async def test_get_cached_transcript():
    """Test getting a cached transcript."""
    # Set up mock
    with patch("app.utils.cache.get_cache") as mock_get_cache, \
         patch("app.utils.cache.set_cache") as mock_set_cache:
        mock_get_cache.return_value = {"transcript": "Test transcript", "language": "en"}
        mock_set_cache.return_value = True
        
        # Call the function
        result = await get_cached_transcript("video_id")
        
        # Verify the result
        assert result == {"transcript": "Test transcript", "language": "en"}
        mock_get_cache.assert_called_once_with("transcript:video_id")
        mock_set_cache.assert_called_once()  # Should update access time

@pytest.mark.asyncio
async def test_cache_video_info():
    """Test caching video information."""
    # Set up mock
    with patch("app.utils.cache.set_cache") as mock_set_cache:
        mock_set_cache.return_value = True
        
        # Call the function
        result = await cache_video_info("video_id", {"title": "Test Video", "transcript": "Test transcript"})
        
        # Verify the result
        assert result is True
        mock_set_cache.assert_called_once_with("video_info:video_id", {"title": "Test Video", "transcript": "Test transcript"})

@pytest.mark.asyncio
async def test_get_cached_video_info():
    """Test getting cached video information."""
    # Set up mock
    with patch("app.utils.cache.get_cache") as mock_get_cache, \
         patch("app.utils.cache.set_cache") as mock_set_cache:
        mock_get_cache.return_value = {"title": "Test Video", "transcript": "Test transcript"}
        mock_set_cache.return_value = True
        
        # Call the function
        result = await get_cached_video_info("video_id")
        
        # Verify the result
        assert result == {"title": "Test Video", "transcript": "Test transcript"}
        mock_get_cache.assert_called_once_with("video_info:video_id")
        mock_set_cache.assert_called_once()  # Should update access time
