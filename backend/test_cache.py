"""
Test script for cache module.

This script tests the cache functionality to ensure it correctly
handles caching and retrieval of data.
"""

import asyncio
import logging
import cache
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_cache():
    """Test basic cache functionality."""
    
    # Initialize Redis
    await cache.init_redis()
    
    # Test setting and getting cache
    logger.info("Testing basic cache functionality...")
    test_key = "test:key"
    test_value = {"test": "value", "number": 123}
    
    # Set cache
    success = await cache.set_cache(test_key, test_value)
    logger.info(f"Set cache result: {success}")
    
    # Get cache
    cached_value = await cache.get_cache(test_key)
    logger.info(f"Got cached value: {cached_value}")
    assert cached_value is not None, "Failed to retrieve cached value"
    assert cached_value.get("test") == "value", "Cached value does not match"
    
    # Test cache with expiration
    logger.info("Testing cache with expiration...")
    expiry_key = "test:expiry"
    expiry_value = {"test": "expiry", "number": 456}
    
    # Set cache with 2 second expiration
    success = await cache.set_cache(expiry_key, expiry_value, expiry_seconds=2)
    logger.info(f"Set cache with expiration result: {success}")
    
    # Get cache immediately
    cached_value = await cache.get_cache(expiry_key)
    logger.info(f"Got cached value with expiration: {cached_value}")
    assert cached_value is not None, "Failed to retrieve cached value with expiration"
    
    # Wait for expiration
    logger.info("Waiting for cache to expire...")
    await asyncio.sleep(3)
    
    # Get cache after expiration
    cached_value = await cache.get_cache(expiry_key)
    logger.info(f"Got cached value after expiration: {cached_value}")
    assert cached_value is None, "Cache did not expire as expected"
    
    # Test transcript caching
    logger.info("Testing transcript caching...")
    video_id = "test_video_id"
    transcript_data = {
        "transcript": "This is a test transcript.",
        "language": "en"
    }
    
    # Cache transcript
    success = await cache.cache_transcript(video_id, transcript_data)
    logger.info(f"Cache transcript result: {success}")
    
    # Get cached transcript
    cached_transcript = await cache.get_cached_transcript(video_id)
    logger.info(f"Got cached transcript: {cached_transcript}")
    assert cached_transcript is not None, "Failed to retrieve cached transcript"
    assert cached_transcript.get("transcript") == "This is a test transcript.", "Cached transcript does not match"
    
    # Test summary caching
    logger.info("Testing summary caching...")
    summary_type = "Brief"
    summary_length = "Medium"
    summary_text = "This is a test summary."
    
    # Cache summary
    success = await cache.cache_summary_result(video_id, summary_type, summary_length, summary_text)
    logger.info(f"Cache summary result: {success}")
    
    # Get cached summary
    cached_summary = await cache.get_cached_summary(video_id, summary_type, summary_length)
    logger.info(f"Got cached summary: {cached_summary}")
    assert cached_summary is not None, "Failed to retrieve cached summary"
    assert cached_summary.get("summary_text") == "This is a test summary.", "Cached summary does not match"
    
    # Test cache stats
    logger.info("Testing cache stats...")
    stats = await cache.get_cache_stats()
    logger.info(f"Cache stats: {json.dumps(stats, indent=2)}")
    
    # Clean up
    logger.info("Cleaning up...")
    await cache.delete_cache(test_key)
    await cache.delete_cache(f"transcript:{video_id}")
    await cache.delete_cache(f"summary:{video_id}:{summary_type}:{summary_length}")
    
    # Close Redis connection
    await cache.close_redis()
    
    logger.info("All cache tests passed!")

if __name__ == "__main__":
    asyncio.run(test_cache())
