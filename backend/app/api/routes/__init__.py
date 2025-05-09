"""
API routes package for the YouTube Summarizer API.

This module imports and combines all route modules.
"""

from fastapi import APIRouter
from app.api.routes.videos import router as videos_router
from app.api.routes.summaries import router as summaries_router
from app.api.routes.qa import router as qa_router
from app.api.routes.cache import router as cache_router

# Create main router
router = APIRouter()

# Include all routers
router.include_router(videos_router)
router.include_router(summaries_router)
router.include_router(qa_router)
router.include_router(cache_router)