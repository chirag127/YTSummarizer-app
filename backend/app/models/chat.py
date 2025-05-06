"""
Chat models for the YouTube Summarizer backend.

This module defines Pydantic models for chat-related data.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone

class ChatMessageRole:
    """Chat message role constants."""
    USER = "user"
    MODEL = "model"

class ChatMessage(BaseModel):
    """Chat message model."""
    role: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VideoQARequest(BaseModel):
    """Request model for asking a question about a video."""
    question: str
    history: Optional[List[ChatMessage]] = None

class VideoQAResponse(BaseModel):
    """Response model for a video Q&A."""
    video_id: str
    video_title: Optional[str] = None
    video_thumbnail_url: Optional[str] = None
    history: List[ChatMessage]
    has_transcript: bool
    token_count: int = 0
    transcript_token_count: int = 0
