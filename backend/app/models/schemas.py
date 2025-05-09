"""
Pydantic models for the YouTube Summarizer API.

This module defines the data models used for request validation,
response serialization, and database operations.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone

# Helper function to get current time in UTC timezone
def get_utc_now() -> datetime:
    """Get current time in UTC timezone."""
    return datetime.now(timezone.utc)

# Summary types and lengths
class SummaryType(str):
    BRIEF = "Brief"
    DETAILED = "Detailed"
    KEY_POINT = "Key Point"
    CHAPTERS = "Chapters"

class SummaryLength(str):
    SHORT = "Short"
    MEDIUM = "Medium"
    LONG = "Long"

# Request models
class YouTubeURL(BaseModel):
    url: str
    summary_type: str = SummaryType.BRIEF
    summary_length: str = SummaryLength.MEDIUM

# Summary models
class Summary(BaseModel):
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
    # Additional fields for regenerated summaries
    original_summary_id: Optional[str] = None
    is_regenerated: Optional[bool] = False
    regenerated_at: Optional[str] = None

class SummaryUpdate(BaseModel):
    summary_type: Optional[str] = None
    summary_length: Optional[str] = None

class StarUpdate(BaseModel):
    is_starred: bool

# Chat models
class ChatMessageRole(str):
    USER = "user"
    MODEL = "model"

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VideoQARequest(BaseModel):
    question: str
    history: Optional[List[ChatMessage]] = None

class VideoQAResponse(BaseModel):
    video_id: str
    video_title: Optional[str] = None
    video_thumbnail_url: Optional[str] = None
    history: List[ChatMessage]
    has_transcript: bool
    token_count: Optional[int] = None
    transcript_token_count: Optional[int] = None
