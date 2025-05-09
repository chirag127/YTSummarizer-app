"""
Video-related API routes for the YouTube Summarizer API.

This module defines the routes for validating YouTube URLs and extracting video information.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any
import logging
from app.models.schemas import YouTubeURL
from app.services.video import extract_video_info
from app.services.database import get_database
from app.utils.url import is_valid_youtube_url

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(tags=["videos"])

@router.post("/validate-url", response_model=Dict[str, Any])
async def validate_url(youtube_url: YouTubeURL):
    """Validate YouTube URL and extract basic information."""
    url = str(youtube_url.url)

    if not is_valid_youtube_url(url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    try:
        video_info = await extract_video_info(url)

        if not video_info.get('transcript'):
            return {
                "valid": True,
                "has_transcript": False,
                "title": video_info.get('title'),
                "thumbnail": video_info.get('thumbnail'),
                "message": "Video found, but no transcript/captions available for summarization."
            }

        return {
            "valid": True,
            "has_transcript": True,
            "title": video_info.get('title'),
            "thumbnail": video_info.get('thumbnail'),
            "transcript_language": video_info.get('transcript_language'),
            "message": "Valid YouTube URL with available transcript."
        }
    except Exception as e:
        logger.error(f"Error validating URL: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing URL: {str(e)}")
