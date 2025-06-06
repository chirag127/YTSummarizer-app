"""
Main application module for the YouTube Summarizer API.

This module initializes the FastAPI application, sets up middleware,
and includes all API routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.routes import router
from app.services.database import close_db
from app.core import cache

@asynccontextmanager
async def lifespan(_: FastAPI):
    """
    Lifespan context manager for FastAPI application.
    Handles startup and shutdown events for database connections and other resources.

    Both MongoDB and Redis connections are now lazily initialized when needed.
    """
    try:
        # Both MongoDB and Redis are now lazily initialized when needed
        yield  # This is where the app runs
    finally:
        # Close MongoDB connection if it was initialized
        await close_db()

        # Close Redis connection if it was initialized
        await cache.close_redis()

# Initialize FastAPI app with lifespan
app = FastAPI(title="YouTube Summarizer API", lifespan=lifespan)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routes
app.include_router(router)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "YouTube Summarizer API is running"}
