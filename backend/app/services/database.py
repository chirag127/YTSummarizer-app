"""
Database service for the YouTube Summarizer API.

This module provides functions for interacting with the MongoDB database.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import MONGODB_URI, DATABASE_NAME, logger

# Database client (initialized in main.py)
client = None

def get_database():
    """
    Get the database instance.
    
    Returns:
        The database instance
    """
    return client[DATABASE_NAME]

async def init_db():
    """
    Initialize the database connection and create indexes.
    
    Returns:
        The database client
    """
    global client
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(MONGODB_URI)
        # Ping the database to check connection
        await client.admin.command('ping')
        logger.info("Connected to MongoDB")

        # Create optimized indexes for collections
        db = client[DATABASE_NAME]
        try:
            # Create indexes for video_chats collection
            await db.video_chats.create_index("videoId")
            logger.info("Created index on videoId field in video_chats collection")

            await db.video_chats.create_index("userId")
            logger.info("Created index on userId field in video_chats collection")

            # Create compound index for efficient sorting and filtering
            await db.video_chats.create_index([("videoId", 1), ("updatedAt", -1)])
            logger.info("Created compound index on videoId and updatedAt fields in video_chats collection")

            # Create indexes for summaries collection
            await db.summaries.create_index("video_url")
            logger.info("Created index on video_url field in summaries collection")

            await db.summaries.create_index([("created_at", -1)])
            logger.info("Created index on created_at field in summaries collection")

            await db.summaries.create_index([("is_starred", 1), ("created_at", -1)])
            logger.info("Created compound index on is_starred and created_at fields in summaries collection")

            # Create compound index for summary type and length queries
            await db.summaries.create_index([
                ("video_url", 1),
                ("summary_type", 1),
                ("summary_length", 1)
            ])
            logger.info("Created compound index for summary type and length queries in summaries collection")
        except Exception as index_error:
            logger.error(f"Error creating indexes for collections: {index_error}")

        return client
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_db():
    """Close the database connection."""
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")
