"""
Cache module for YouTube Summarizer backend.

This module provides caching functionality for transcripts and other data
using Redis as the caching layer. Cached data remains indefinitely until
memory limits are reached, at which point a memory management strategy is applied.
"""

import json
from typing import Any, Dict, Optional
import redis.asyncio as redis
from datetime import datetime, timezone

from app.config import settings, logger

# Redis connection
redis_client = None

# Maximum memory usage percentage before triggering cleanup
MAX_MEMORY_PERCENT = settings.cache.MAX_MEMORY_PERCENT

# Maximum number of keys to keep in cache
MAX_CACHE_KEYS = settings.cache.MAX_CACHE_KEYS

async def init_redis():
    """Initialize Redis connection."""
    global redis_client
    redis_url = settings.cache.REDIS_URL
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

async def set_cache(key: str, value: Any, expiry_seconds: int = None) -> bool:
    """
    Set a value in the cache with optional expiration.

    Args:
        key: Cache key
        value: Value to cache (will be JSON serialized)
        expiry_seconds: Optional expiration time in seconds

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

            # Add cache metadata for debugging
            value['_cache_key'] = key

            # For transcript data, add size information
            if key.startswith('transcript:') and 'transcript' in value:
                transcript_length = len(value.get('transcript', ''))
                value['_transcript_length'] = transcript_length
                logger.info(f"Caching transcript with length {transcript_length} characters for key {key}")

        # Serialize value to JSON
        serialized_value = json.dumps(value)

        # Calculate size for logging
        size_kb = len(serialized_value) / 1024

        # Set with or without expiration
        if expiry_seconds:
            await redis_client.setex(key, expiry_seconds, serialized_value)
            logger.debug(f"Cached data with key: {key} (expires in {expiry_seconds}s, size: {size_kb:.2f}KB)")
        else:
            await redis_client.set(key, serialized_value)
            logger.debug(f"Cached data with key: {key} (permanent storage, size: {size_kb:.2f}KB)")

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
            # Skip special keys
            if key == "last_cleanup_time":
                continue

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
            # Group keys by type for better logging
            key_types = {}
            for key, _ in keys_to_remove:
                key_type = key.split(':')[0] if ':' in key else 'other'
                key_types[key_type] = key_types.get(key_type, 0) + 1

                # Delete the key
                await redis_client.delete(key)

            # Log detailed cleanup information
            cleanup_info = ", ".join([f"{count} {key_type} keys" for key_type, count in key_types.items()])
            logger.info(f"LRU cleanup: removed {len(keys_to_remove)} oldest items ({cleanup_info})")

            # Record cleanup time
            cleanup_time = datetime.now(timezone.utc).isoformat()
            await redis_client.set("last_cleanup_time", cleanup_time)
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

    # Transcripts are stored indefinitely (no expiry)
    # This is a high-value cache item that's expensive to regenerate
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

    # Video info is stored indefinitely (no expiry)
    # This is metadata that rarely changes and is frequently accessed

    # Add size information for transcript if present
    if 'transcript' in video_info:
        transcript_length = len(video_info.get('transcript', ''))
        video_info['_transcript_length'] = transcript_length
        logger.info(f"Caching video info with transcript length {transcript_length} characters for video ID {video_id}")

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

async def cache_summary_result(video_id: str, summary_type: str, summary_length: str, summary_text: str) -> bool:
    """
    Cache a generated summary result.

    Args:
        video_id: YouTube video ID
        summary_type: Type of summary (Brief, Detailed, etc.)
        summary_length: Length of summary (Short, Medium, Long)
        summary_text: The generated summary text

    Returns:
        bool: True if successful, False otherwise
    """
    key = f"summary:{video_id}:{summary_type}:{summary_length}"

    # Store summary data
    summary_data = {
        'video_id': video_id,
        'summary_type': summary_type,
        'summary_length': summary_length,
        'summary_text': summary_text,
        'generated_at': datetime.now(timezone.utc).isoformat()
    }

    # Summaries are stored indefinitely (no expiry)
    # They are expensive to regenerate and the results don't change for the same video
    logger.info(f"Caching summary result for video ID {video_id}, type {summary_type}, length {summary_length}")
    return await set_cache(key, summary_data)

async def get_cached_summary(video_id: str, summary_type: str, summary_length: str) -> Optional[Dict[str, Any]]:
    """
    Get a cached summary result.

    Args:
        video_id: YouTube video ID
        summary_type: Type of summary (Brief, Detailed, etc.)
        summary_length: Length of summary (Short, Medium, Long)

    Returns:
        Dictionary containing summary data or None if not cached
    """
    key = f"summary:{video_id}:{summary_type}:{summary_length}"
    data = await get_cache(key)
    if data and isinstance(data, dict):
        # Update access time for LRU algorithm
        await set_cache(key, data)
        logger.info(f"Cache hit for summary: video ID {video_id}, type {summary_type}, length {summary_length}")
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
            "summary_keys": len(await redis_client.keys("summary:*")),
            "task_keys": len(await redis_client.keys("task:*")),
            "last_cleanup": await get_cache("last_cleanup_time") or "Never",
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
