"""
Video routes for the YouTube Summarizer backend.

This module defines API routes for video-related operations.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any

from app.models.video import YouTubeURL, VideoValidationResponse
from app.services.video_service import extract_video_info, is_valid_youtube_url
from app.api.dependencies import get_database

router = APIRouter(prefix="/videos", tags=["videos"])

@router.post("/validate-url", response_model=VideoValidationResponse)
async def validate_url(youtube_url: YouTubeURL):
    """Validate a YouTube URL and check for transcript availability."""
    url = str(youtube_url.url)
    
    # Check if URL is valid
    if not is_valid_youtube_url(url):
        return VideoValidationResponse(
            url=url,
            is_valid=False,
            has_transcript=False,
            error="Invalid YouTube URL"
        )
    
    try:
        # Extract video information
        video_info = await extract_video_info(url)
        
        # Check if transcript is available
        has_transcript = video_info.get('transcript') is not None
        
        return VideoValidationResponse(
            url=url,
            is_valid=True,
            has_transcript=has_transcript,
            video_title=video_info.get('title'),
            video_thumbnail_url=video_info.get('thumbnail'),
            error=video_info.get('error')
        )
    except Exception as e:
        return VideoValidationResponse(
            url=url,
            is_valid=True,
            has_transcript=False,
            error=str(e)
        )
