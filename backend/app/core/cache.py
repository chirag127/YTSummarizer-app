"""
Cache module for YouTube Summarizer backend.

This module provides caching functionality for transcripts and other data
using Redis as the caching layer. Cached data remains indefinitely until
memory limits are reached, at which point a memory management strategy is applied.

The module uses lazy initialization of Redis connections to improve startup time.
"""

import json
import os
import asyncio
from typing import Any, Dict, Optional
import logging
import redis.asyncio as redis
from datetime import datetime, timezone
import functools

# Configure logging
logger = logging.getLogger(__name__)

# Maximum memory usage percentage before triggering cleanup (default: 90%)
MAX_MEMORY_PERCENT = float(os.getenv("MAX_MEMORY_PERCENT", 90.0))

# Maximum number of keys to keep in cache (default: 10000)
MAX_CACHE_KEYS = int(os.getenv("MAX_CACHE_KEYS", 10000))

# Cache TTL settings (None = no expiration)
VIDEO_INFO_TTL = None  # No expiration for video info
TRANSCRIPT_TTL = None  # No expiration for transcripts
LANGUAGES_TTL = None   # No expiration for language info

# Cache prefix constants for better organization
PREFIX_VIDEO_INFO = "video_info"
PREFIX_TRANSCRIPT = "transcript"
PREFIX_LANGUAGES = "languages"

# Redis connection
redis_client = None
# Connection pool settings
REDIS_POOL_SIZE = int(os.getenv("REDIS_POOL_SIZE", 10))
REDIS_POOL_TIMEOUT = int(os.getenv("REDIS_POOL_TIMEOUT", 30))
# Flag to track if initialization has been attempted
_init_attempted = False

# Decorator for lazy Redis initialization
def ensure_redis_connection(func):
    """Decorator to ensure Redis connection is initialized before function execution."""
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        global redis_client, _init_attempted
        if redis_client is None and not _init_attempted:
            await init_redis()
        return await func(*args, **kwargs)
    return wrapper

async def init_redis():
    """Initialize Redis connection with connection pooling."""
    global redis_client, _init_attempted
    _init_attempted = True
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    try:
        # Create Redis client with connection pool for better performance
        redis_client = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=REDIS_POOL_SIZE,
            socket_timeout=REDIS_POOL_TIMEOUT
        )

        # Test the connection
        await redis_client.ping()

        # Get Redis info for logging
        info = await redis_client.info()
        redis_version = info.get("redis_version", "unknown")

        logger.info(f"Connected to Redis at {redis_url} (version: {redis_version})")
        logger.info(f"Redis connection pool configured with {REDIS_POOL_SIZE} connections")

        # Perform initial memory check
        await check_memory_usage()

        return redis_client
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        redis_client = None
        return None

async def close_redis():
    """Close Redis connection."""
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("Redis connection closed")

def generate_cache_key(prefix: str, identifier: str) -> str:
    """
    Generate a standardized cache key.

    Args:
        prefix: The cache type prefix
        identifier: The unique identifier (e.g., video_id)

    Returns:
        A formatted cache key
    """
    return f"{prefix}:{identifier}"

@ensure_redis_connection
async def set_cache(key: str, value: Any, ttl: Optional[int] = None) -> bool:
    """
    Set a value in the cache with optional expiration.

    Args:
        key: Cache key
        value: Value to cache (will be JSON serialized)
        ttl: Time to live in seconds (None for no expiration)

    Returns:
        bool: True if successful, False otherwise
    """
    if not redis_client:
        logger.warning("Redis not initialized, skipping cache set")
        return False

    try:
        # Check memory usage before adding new data
        await check_memory_usage()

        # Add metadata to value for better management
        if isinstance(value, dict):
            now = datetime.now(timezone.utc).isoformat()
            value['_cached_at'] = now
            value['_last_accessed'] = now
            value['_access_count'] = value.get('_access_count', 0)

        # Serialize value to JSON
        serialized_value = json.dumps(value)

        # Use pipeline for more efficient operations
        pipe = redis_client.pipeline()
        pipe.set(key, serialized_value)

        # Set expiration if provided
        if ttl:
            pipe.expire(key, ttl)
            expiry_info = f"(expires in {ttl}s)"
        else:
            expiry_info = "(permanent storage)"

        # Execute pipeline
        await pipe.execute()

        logger.debug(f"Cached data with key: {key} {expiry_info}")
        return True
    except Exception as e:
        logger.error(f"Error setting cache for key {key}: {e}")
        return False

@ensure_redis_connection
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

@ensure_redis_connection
async def apply_lru_cleanup():
    """
    Apply Least Recently Used (LRU) cleanup strategy to free up memory.
    Removes the oldest 20% of cached items based on access time and frequency.
    Uses a more efficient batch processing approach.
    """
    if not redis_client:
        return

    try:
        # Get all keys
        all_keys = await redis_client.keys("*")
        if not all_keys:
            return

        logger.info(f"Starting LRU cleanup with {len(all_keys)} total keys")

        # Process keys in batches to avoid memory spikes
        batch_size = 100
        key_batches = [all_keys[i:i + batch_size] for i in range(0, len(all_keys), batch_size)]

        # Collect key metadata
        key_metadata = []

        for batch in key_batches:
            # Use pipeline for batch retrieval
            pipe = redis_client.pipeline()
            for key in batch:
                pipe.get(key)

            # Execute pipeline
            results = await pipe.execute()

            # Process results
            for i, value in enumerate(results):
                key = batch[i]
                try:
                    if value:
                        data = json.loads(value)
                        if isinstance(data, dict):
                            # Calculate a score based on recency and access count
                            # Lower score = higher priority for removal
                            last_accessed = data.get('_last_accessed', data.get('_cached_at', "1970-01-01T00:00:00"))
                            access_count = data.get('_access_count', 0)

                            # Simple scoring formula: recent + frequently accessed = keep
                            key_metadata.append((key, last_accessed, access_count))
                        else:
                            # No metadata, prioritize for removal
                            key_metadata.append((key, "1970-01-01T00:00:00", 0))
                except Exception:
                    # If we can't parse the value, prioritize it for removal
                    key_metadata.append((key, "1970-01-01T00:00:00", 0))

        # Sort by last accessed time (oldest first) and then by access count (least accessed first)
        key_metadata.sort(key=lambda x: (x[1], x[2]))

        # Calculate how many keys to remove (20% of total)
        remove_count = int(len(key_metadata) * 0.2)
        if remove_count == 0 and len(key_metadata) > 0:
            remove_count = 1  # Remove at least one key if we have any

        # Get keys to remove
        keys_to_remove = [item[0] for item in key_metadata[:remove_count]]

        if keys_to_remove:
            # Use pipeline for batch deletion
            pipe = redis_client.pipeline()
            for key in keys_to_remove:
                pipe.delete(key)

            # Execute pipeline
            await pipe.execute()

            logger.info(f"LRU cleanup: Removed {len(keys_to_remove)} oldest/least used items from cache")

            # Log some stats about what was kept vs removed
            if len(key_metadata) > remove_count:
                oldest_kept = key_metadata[remove_count][1]
                logger.debug(f"Oldest item kept was from: {oldest_kept}")
    except Exception as e:
        logger.error(f"Error applying LRU cleanup: {e}")

@ensure_redis_connection
async def get_cache(key: str, update_access_stats: bool = True) -> Optional[Any]:
    """
    Get a value from the cache.

    Args:
        key: Cache key
        update_access_stats: Whether to update access statistics (default: True)

    Returns:
        The cached value or None if not found
    """
    if not redis_client:
        logger.warning("Redis not initialized, skipping cache get")
        return None

    try:
        # Get from cache
        cached_value = await redis_client.get(key)
        if not cached_value:
            logger.debug(f"Cache miss for key: {key}")
            return None

        # Deserialize from JSON
        value = json.loads(cached_value)
        logger.debug(f"Cache hit for key: {key}")

        # Update access statistics if requested
        if update_access_stats and isinstance(value, dict):
            # Update access count and last accessed time
            value['_access_count'] = value.get('_access_count', 0) + 1
            value['_last_accessed'] = datetime.now(timezone.utc).isoformat()

            # Update the cache with new metadata (don't wait for result)
            asyncio.create_task(
                set_cache(key, value, None)
            )

        return value
    except Exception as e:
        logger.error(f"Error getting cache for key {key}: {e}")
        return None

@ensure_redis_connection
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

@ensure_redis_connection
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
    key = generate_cache_key(PREFIX_TRANSCRIPT, video_id)
    return await set_cache(key, transcript_data, TRANSCRIPT_TTL)

async def get_cached_transcript(video_id: str) -> Optional[Dict[str, Any]]:
    """
    Get cached transcript data for a video.

    Args:
        video_id: YouTube video ID

    Returns:
        Dictionary containing transcript text and language or None if not cached
    """
    key = generate_cache_key(PREFIX_TRANSCRIPT, video_id)
    # The get_cache function now automatically updates access stats
    return await get_cache(key)

async def cache_video_info(video_id: str, video_info: Dict[str, Any]) -> bool:
    """
    Cache video information.

    Args:
        video_id: YouTube video ID
        video_info: Dictionary containing video information

    Returns:
        bool: True if successful, False otherwise
    """
    key = generate_cache_key(PREFIX_VIDEO_INFO, video_id)
    return await set_cache(key, video_info, VIDEO_INFO_TTL)

async def get_cached_video_info(video_id: str) -> Optional[Dict[str, Any]]:
    """
    Get cached video information.

    Args:
        video_id: YouTube video ID

    Returns:
        Dictionary containing video information or None if not cached
    """
    key = generate_cache_key(PREFIX_VIDEO_INFO, video_id)
    return await get_cache(key)

async def cache_available_languages(video_id: str, languages: Dict[str, Any]) -> bool:
    """
    Cache available subtitle languages for a video.

    Args:
        video_id: YouTube video ID
        languages: Dictionary containing available languages

    Returns:
        bool: True if successful, False otherwise
    """
    key = generate_cache_key(PREFIX_LANGUAGES, video_id)
    return await set_cache(key, languages, LANGUAGES_TTL)

async def get_cached_languages(video_id: str) -> Optional[Dict[str, Any]]:
    """
    Get cached available subtitle languages for a video.

    Args:
        video_id: YouTube video ID

    Returns:
        Dictionary containing available languages or None if not cached
    """
    key = generate_cache_key(PREFIX_LANGUAGES, video_id)
    return await get_cache(key)

@ensure_redis_connection
async def get_cache_stats() -> Dict[str, Any]:
    """
    Get detailed cache statistics.

    Returns:
        Dictionary containing cache statistics
    """
    if not redis_client:
        return {"status": "Redis not connected"}

    try:
        # Get memory info
        memory_info = await redis_client.info("memory")
        server_info = await redis_client.info("server")
        stats_info = await redis_client.info("stats")

        # Get key counts by prefix
        transcript_keys = await redis_client.keys(f"{PREFIX_TRANSCRIPT}:*")
        video_info_keys = await redis_client.keys(f"{PREFIX_VIDEO_INFO}:*")
        languages_keys = await redis_client.keys(f"{PREFIX_LANGUAGES}:*")

        # Calculate total size
        total_keys = await redis_client.dbsize()

        stats = {
            "status": "Connected",
            "redis_version": server_info.get("redis_version", "Unknown"),
            "uptime_days": server_info.get("uptime_in_days", "Unknown"),

            # Memory stats
            "used_memory_human": memory_info.get("used_memory_human", "Unknown"),
            "maxmemory_human": memory_info.get("maxmemory_human", "Unknown"),
            "memory_percent": "Unknown",
            "memory_fragmentation_ratio": memory_info.get("mem_fragmentation_ratio", "Unknown"),

            # Key stats
            "total_keys": total_keys,
            "transcript_keys": len(transcript_keys),
            "video_info_keys": len(video_info_keys),
            "languages_keys": len(languages_keys),
            "other_keys": total_keys - len(transcript_keys) - len(video_info_keys) - len(languages_keys),

            # Performance stats
            "keyspace_hits": stats_info.get("keyspace_hits", 0),
            "keyspace_misses": stats_info.get("keyspace_misses", 0),
            "hit_rate": 0.0,  # Will calculate below if possible

            # Configuration
            "cleanup_threshold": f"{MAX_MEMORY_PERCENT}%",
            "max_keys_limit": MAX_CACHE_KEYS,
            "connection_pool_size": REDIS_POOL_SIZE,
        }

        # Calculate memory percentage if possible
        used_memory = int(memory_info.get("used_memory", 0))
        max_memory = int(memory_info.get("maxmemory", 0))
        if max_memory > 0:
            memory_percent = (used_memory / max_memory) * 100
            stats["memory_percent"] = f"{memory_percent:.2f}%"

        # Calculate hit rate if possible
        hits = int(stats_info.get("keyspace_hits", 0))
        misses = int(stats_info.get("keyspace_misses", 0))
        if hits + misses > 0:
            hit_rate = (hits / (hits + misses)) * 100
            stats["hit_rate"] = f"{hit_rate:.2f}%"

        # Get some sample key metadata if available
        if transcript_keys and len(transcript_keys) > 0:
            # Get a random transcript key for stats
            sample_key = transcript_keys[0]
            sample_data = await get_cache(sample_key, update_access_stats=False)
            if sample_data and isinstance(sample_data, dict):
                stats["sample_transcript_metadata"] = {
                    "cached_at": sample_data.get("_cached_at", "Unknown"),
                    "last_accessed": sample_data.get("_last_accessed", "Unknown"),
                    "access_count": sample_data.get("_access_count", 0)
                }

        return stats
    except Exception as e:
        logger.error(f"Error getting cache stats: {e}")
        return {"status": f"Error: {str(e)}"}
