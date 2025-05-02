"""
Cache module for YouTube Summarizer backend.

This module provides caching functionality for transcripts and other data
using Redis as the caching layer. Cached data remains indefinitely until
memory limits are reached, at which point a memory management strategy is applied.
"""

import json
import os
from typing import Any, Dict, Optional
import logging
import redis.asyncio as redis
from datetime import datetime, timezone

# Configure logging
logger = logging.getLogger(__name__)

# Maximum memory usage percentage before triggering cleanup (default: 90%)
MAX_MEMORY_PERCENT = float(os.getenv("MAX_MEMORY_PERCENT", 90.0))

# Maximum number of keys to keep in cache (default: 10000)
MAX_CACHE_KEYS = int(os.getenv("MAX_CACHE_KEYS", 10000))

# Redis connection
redis_client = None

async def init_redis():
    """Initialize Redis connection."""
    global redis_client
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    try:
        redis_client = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True
        )
        # Test the connection
        await redis_client.ping()
        logger.info(f"Connected to Redis at {redis_url}")
        return redis_client
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        return None

async def close_redis():
    """Close Redis connection."""
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("Redis connection closed")

async def set_cache(key: str, value: Any) -> bool:
    """
    Set a value in the cache without expiration.

    Args:
        key: Cache key
        value: Value to cache (will be JSON serialized)

    Returns:
        bool: True if successful, False otherwise
    """
    if not redis_client:
        logger.warning("Redis not initialized, skipping cache set")
        return False

    try:
        # Check memory usage before adding new data
        await check_memory_usage()

        # Add timestamp to value for LRU implementation
        if isinstance(value, dict):
            value['_cached_at'] = datetime.now(timezone.utc).isoformat()

        # Serialize value to JSON
        serialized_value = json.dumps(value)

        # Set without expiration
        await redis_client.set(key, serialized_value)
        logger.debug(f"Cached data with key: {key} (permanent storage)")
        return True
    except Exception as e:
        logger.error(f"Error setting cache for key {key}: {e}")
        return False

async def check_memory_usage():
    """
    Check Redis memory usage and apply cleanup if needed.
    """
    if not redis_client:
        return

    try:
        # Get memory info
        info = await redis_client.info("memory")
        used_memory = int(info.get("used_memory", 0))
        max_memory = int(info.get("maxmemory", 0))

        # If maxmemory is not set (0), we can't calculate percentage
        if max_memory == 0:
            # Check if we have too many keys instead
            num_keys = await redis_client.dbsize()
            if num_keys > MAX_CACHE_KEYS:
                logger.info(f"Cache has {num_keys} keys, exceeding limit of {MAX_CACHE_KEYS}. Running LRU cleanup.")
                await apply_lru_cleanup()
            return

        # Calculate memory usage percentage
        memory_percent = (used_memory / max_memory) * 100

        # If memory usage exceeds threshold, apply LRU cleanup
        if memory_percent > MAX_MEMORY_PERCENT:
            logger.info(f"Memory usage at {memory_percent:.2f}%, exceeding threshold of {MAX_MEMORY_PERCENT}%. Running LRU cleanup.")
            await apply_lru_cleanup()
    except Exception as e:
        logger.error(f"Error checking memory usage: {e}")

async def apply_lru_cleanup():
    """
    Apply Least Recently Used (LRU) cleanup strategy to free up memory.
    Removes the oldest 20% of cached items based on _cached_at timestamp.
    """
    if not redis_client:
        return

    try:
        # Get all keys
        all_keys = await redis_client.keys("*")
        if not all_keys:
            return

        # Get values with timestamps
        key_timestamps = []
        for key in all_keys:
            try:
                value = await redis_client.get(key)
                if value:
                    data = json.loads(value)
                    if isinstance(data, dict) and '_cached_at' in data:
                        key_timestamps.append((key, data['_cached_at']))
                    else:
                        # If no timestamp, use a very old date to prioritize for removal
                        key_timestamps.append((key, "1970-01-01T00:00:00"))
            except Exception:
                # If we can't parse the value, prioritize it for removal
                key_timestamps.append((key, "1970-01-01T00:00:00"))

        # Sort by timestamp (oldest first)
        key_timestamps.sort(key=lambda x: x[1])

        # Remove oldest 20% of keys
        keys_to_remove = key_timestamps[:int(len(key_timestamps) * 0.2)]
        if keys_to_remove:
            for key, _ in keys_to_remove:
                await redis_client.delete(key)
            logger.info(f"Removed {len(keys_to_remove)} oldest items from cache")
    except Exception as e:
        logger.error(f"Error applying LRU cleanup: {e}")

async def get_cache(key: str) -> Optional[Any]:
    """
    Get a value from the cache.

    Args:
        key: Cache key

    Returns:
        The cached value or None if not found
    """
    if not redis_client:
        logger.warning("Redis not initialized, skipping cache get")
        return None

    try:
        # Get from cache
        cached_value = await redis_client.get(key)
        if cached_value:
            # Deserialize from JSON
            value = json.loads(cached_value)
            logger.debug(f"Cache hit for key: {key}")
            return value
        logger.debug(f"Cache miss for key: {key}")
        return None
    except Exception as e:
        logger.error(f"Error getting cache for key {key}: {e}")
        return None

async def delete_cache(key: str) -> bool:
    """
    Delete a value from the cache.

    Args:
        key: Cache key

    Returns:
        bool: True if successful, False otherwise
    """
    if not redis_client:
        logger.warning("Redis not initialized, skipping cache delete")
        return False

    try:
        await redis_client.delete(key)
        logger.debug(f"Deleted cache for key: {key}")
        return True
    except Exception as e:
        logger.error(f"Error deleting cache for key {key}: {e}")
        return False

async def clear_cache() -> bool:
    """
    Clear all cache.

    Returns:
        bool: True if successful, False otherwise
    """
    if not redis_client:
        logger.warning("Redis not initialized, skipping cache clear")
        return False

    try:
        await redis_client.flushdb()
        logger.info("Cache cleared")
        return True
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        return False

# Helper functions for specific cache types

async def cache_transcript(video_id: str, transcript_data: Dict[str, Any]) -> bool:
    """
    Cache transcript data for a video.

    Args:
        video_id: YouTube video ID
        transcript_data: Dictionary containing transcript text and language

    Returns:
        bool: True if successful, False otherwise
    """
    key = f"transcript:{video_id}"
    return await set_cache(key, transcript_data)

async def get_cached_transcript(video_id: str) -> Optional[Dict[str, Any]]:
    """
    Get cached transcript data for a video.

    Args:
        video_id: YouTube video ID

    Returns:
        Dictionary containing transcript text and language or None if not cached
    """
    key = f"transcript:{video_id}"
    data = await get_cache(key)
    if data and isinstance(data, dict):
        # Update access time for LRU algorithm
        await set_cache(key, data)
    return data

async def cache_video_info(video_id: str, video_info: Dict[str, Any]) -> bool:
    """
    Cache video information.

    Args:
        video_id: YouTube video ID
        video_info: Dictionary containing video information

    Returns:
        bool: True if successful, False otherwise
    """
    key = f"video_info:{video_id}"
    return await set_cache(key, video_info)

async def get_cached_video_info(video_id: str) -> Optional[Dict[str, Any]]:
    """
    Get cached video information.

    Args:
        video_id: YouTube video ID

    Returns:
        Dictionary containing video information or None if not cached
    """
    key = f"video_info:{video_id}"
    data = await get_cache(key)
    if data and isinstance(data, dict):
        # Update access time for LRU algorithm
        await set_cache(key, data)
    return data

async def cache_available_languages(video_id: str, languages: Dict[str, Any]) -> bool:
    """
    Cache available subtitle languages for a video.

    Args:
        video_id: YouTube video ID
        languages: Dictionary containing available languages

    Returns:
        bool: True if successful, False otherwise
    """
    key = f"languages:{video_id}"
    return await set_cache(key, languages)

async def get_cached_languages(video_id: str) -> Optional[Dict[str, Any]]:
    """
    Get cached available subtitle languages for a video.

    Args:
        video_id: YouTube video ID

    Returns:
        Dictionary containing available languages or None if not cached
    """
    key = f"languages:{video_id}"
    data = await get_cache(key)
    if data and isinstance(data, dict):
        # Update access time for LRU algorithm
        await set_cache(key, data)
    return data

async def get_cache_stats() -> Dict[str, Any]:
    """
    Get cache statistics.

    Returns:
        Dictionary containing cache statistics
    """
    if not redis_client:
        return {"status": "Redis not connected"}

    try:
        # Get memory info
        info = await redis_client.info("memory")
        stats = {
            "status": "Connected",
            "used_memory_human": info.get("used_memory_human", "Unknown"),
            "maxmemory_human": info.get("maxmemory_human", "Unknown"),
            "memory_percent": "Unknown",
            "total_keys": await redis_client.dbsize(),
            "transcript_keys": len(await redis_client.keys("transcript:*")),
            "video_info_keys": len(await redis_client.keys("video_info:*")),
            "languages_keys": len(await redis_client.keys("languages:*")),
        }

        # Calculate memory percentage if possible
        used_memory = int(info.get("used_memory", 0))
        max_memory = int(info.get("maxmemory", 0))
        if max_memory > 0:
            memory_percent = (used_memory / max_memory) * 100
            stats["memory_percent"] = f"{memory_percent:.2f}%"

        return stats
    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        return {"status": f"Error: {str(e)}"}
