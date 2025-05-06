"""
Main application module for the YouTube Summarizer backend.

This module initializes the FastAPI application and includes all routes.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings, logger
from app.db.mongodb import connect_to_mongodb, close_mongodb_connection
from app.utils.cache import init_redis, close_redis
from app.api.routes.summaries import router as summaries_router
from app.api.routes.videos import router as videos_router
from app.api.routes.chat import router as chat_router
from app.api.routes.cache import router as cache_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for the FastAPI application.
    Handles startup and shutdown events.
    """
    # Startup: Connect to MongoDB and initialize Redis cache
    try:
        # Connect to MongoDB
        client = await connect_to_mongodb()

        # Create indexes for video_chats collection
        db = client[settings.database.DATABASE_NAME]
        try:
            # Create index on videoId field for efficient querying
            await db.video_chats.create_index("videoId")
            logger.info("Created index on videoId field in video_chats collection")

            # Create index on userId field for future user account integration
            await db.video_chats.create_index("userId")
            logger.info("Created index on userId field in video_chats collection")
        except Exception as index_error:
            logger.error(f"Error creating indexes for video_chats collection: {index_error}")

        # Initialize Redis cache
        await init_redis()
    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise

    # Yield control back to the application
    yield

    # Shutdown: Close MongoDB and Redis connections
    await close_mongodb_connection()
    await close_redis()

# Initialize FastAPI app with lifespan context manager
app = FastAPI(
    title=settings.API_TITLE,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)

# Include routers
app.include_router(summaries_router)
app.include_router(videos_router)
app.include_router(chat_router)
app.include_router(cache_router)

# Root endpoint
@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "YouTube Summarizer API is running"}
