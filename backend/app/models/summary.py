"""
Summary models for the YouTube Summarizer backend.

This module defines Pydantic models for summary-related data.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SummaryType:
    """Summary type constants."""
    BRIEF = "Brief"
    DETAILED = "Detailed"
    KEY_POINT = "Key Point"
    CHAPTERS = "Chapters"

class SummaryLength:
    """Summary length constants."""
    SHORT = "Short"
    MEDIUM = "Medium"
    LONG = "Long"

class SummaryRequest(BaseModel):
    """Request model for generating a summary."""
    url: str
    summary_type: str = SummaryType.BRIEF
    summary_length: str = SummaryLength.MEDIUM
    force_regenerate: bool = False

class SummaryUpdate(BaseModel):
    """Request model for updating a summary."""
    summary_type: Optional[str] = None
    summary_length: Optional[str] = None

class StarUpdate(BaseModel):
    """Request model for starring/unstarring a summary."""
    is_starred: bool

class Summary(BaseModel):
    """Summary model."""
    id: Optional[str] = None
    video_url: str
    video_title: Optional[str] = None
    video_thumbnail_url: Optional[str] = None
    summary_text: str
    summary_type: str
    summary_length: str
    transcript_language: Optional[str] = None
    is_starred: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SummaryResponse(BaseModel):
    """Response model for a summary."""
    id: str
    video_url: str
    video_title: Optional[str] = None
    video_thumbnail_url: Optional[str] = None
    summary_text: str
    summary_type: str
    summary_length: str
    transcript_language: Optional[str] = None
    is_starred: Optional[bool] = False
    created_at: datetime
    updated_at: datetime
