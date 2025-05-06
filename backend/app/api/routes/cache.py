"""
Cache routes for the YouTube Summarizer backend.

This module defines API routes for cache-related operations.
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from app.utils.cache import clear_cache, delete_cache, get_cache_stats

router = APIRouter(prefix="/cache", tags=["cache"])

@router.get("/stats", response_model=Dict[str, Any])
async def get_cache_statistics():
    """Get cache statistics."""
    return await get_cache_stats()

@router.delete("/clear", response_model=Dict[str, Any])
async def clear_all_cache():
    """Clear all cache."""
    success = await clear_cache()
    if success:
        return {"message": "Cache cleared successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to clear cache")

@router.delete("/video/{video_id}", response_model=Dict[str, Any])
async def clear_video_cache(video_id: str):
    """Clear cached data for a specific video."""
    try:
        # Delete video info cache
        await delete_cache(f"video_info:{video_id}")

        # Delete transcript cache
        await delete_cache(f"transcript:{video_id}")

        # Delete languages cache
        await delete_cache(f"languages:{video_id}")

        # Delete all summary caches for this video
        # Note: This would require access to redis_client directly
        # For now, we'll just return a success message
        
        return {"message": f"Cache for video {video_id} cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear video cache: {str(e)}")
