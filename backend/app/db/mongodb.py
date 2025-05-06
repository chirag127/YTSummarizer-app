"""
MongoDB connection module for the YouTube Summarizer backend.

This module provides functions to connect to MongoDB, close the connection,
and get the database instance.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings, logger

# Database connection
client = None

async def connect_to_mongodb():
    """Connect to MongoDB."""
    global client
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(settings.database.MONGODB_URI)
        # Ping the database to check connection
        await client.admin.command('ping')
        logger.info("Connected to MongoDB")
        return client
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongodb_connection():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")

def get_database():
    """Get database instance."""
    return client[settings.database.DATABASE_NAME]
