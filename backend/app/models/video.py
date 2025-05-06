"""
Video models for the YouTube Summarizer backend.

This module defines Pydantic models for video-related data.
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any

class YouTubeURL(BaseModel):
    """YouTube URL model."""
    url: str

class VideoInfo(BaseModel):
    """Video information model."""
    title: str
    thumbnail: Optional[str] = None
    transcript: Optional[str] = None
    transcript_language: Optional[str] = None
    error: Optional[str] = None

class VideoValidationResponse(BaseModel):
    """Response model for video validation."""
    url: str
    is_valid: bool
    has_transcript: bool
    video_title: Optional[str] = None
    video_thumbnail_url: Optional[str] = None
    error: Optional[str] = None
