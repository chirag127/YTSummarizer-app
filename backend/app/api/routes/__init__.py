"""
API routes for the YouTube Summarizer backend.

This module exports all route handlers.
"""

from app.api.routes.summaries import router as summaries_router
from app.api.routes.videos import router as videos_router
from app.api.routes.chat import router as chat_router
from app.api.routes.cache import router as cache_router

# Export all routers
__all__ = ['summaries_router', 'videos_router', 'chat_router', 'cache_router']