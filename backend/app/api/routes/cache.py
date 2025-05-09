"""
Cache management API routes for the YouTube Summarizer API.

This module defines the routes for managing the Redis cache.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging
from app.core import cache

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(tags=["cache"])

@router.delete("/cache", response_model=Dict[str, Any])
async def clear_all_cache():
    """Clear all cached data."""
    try:
        result = await cache.clear_cache()
        if result:
            return {"message": "Cache cleared successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to clear cache")
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        raise HTTPException(status_code=500, detail=f"Error clearing cache: {str(e)}")

@router.delete("/cache/video/{video_id}", response_model=Dict[str, Any])
async def clear_video_cache(video_id: str):
    """Clear cached data for a specific video."""
    try:
        # Delete video info cache
        await cache.delete_cache(f"video_info:{video_id}")

        # Delete transcript cache
        await cache.delete_cache(f"transcript:{video_id}")

        # Delete languages cache
        await cache.delete_cache(f"languages:{video_id}")

        return {"message": f"Cache for video {video_id} cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing cache for video {video_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error clearing cache: {str(e)}")

@router.get("/cache/status", response_model=Dict[str, Any])
async def get_cache_status():
    """Get cache status information."""
    try:
        stats = await cache.get_cache_stats()
        return stats
    except Exception as e:
        logger.error(f"Error getting cache status: {e}")
        raise HTTPException(status_code=500, detail=f"Error getting cache status: {str(e)}")
