"""
Summary service for the YouTube Summarizer backend.

This module provides functions for creating, retrieving, updating, and deleting summaries.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from bson import ObjectId

from app.config import logger
from app.models.summary import SummaryRequest, SummaryUpdate
from app.services.video_service import extract_video_info, is_valid_youtube_url, extract_video_id
from app.services.ai_service import generate_summary
from app.utils.cache import get_cached_summary, cache_summary_result

def get_utc_now():
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)

async def create_summary(request: SummaryRequest, db, user_api_key: str = None) -> Dict[str, Any]:
    """Generate summary for a YouTube video and store it."""
    url = str(request.url)

    if not is_valid_youtube_url(url):
        raise ValueError("Invalid YouTube URL")

    # Check if summary already exists with the same URL, type, and length
    if not request.force_regenerate:
        # First check Redis cache for faster response
        video_id = extract_video_id(url)
        if video_id:
            cached_summary = await get_cached_summary(
                video_id,
                request.summary_type,
                request.summary_length
            )

            if cached_summary and 'summary_text' in cached_summary:
                logger.info(f"Using cached summary for video ID {video_id}, type {request.summary_type}, length {request.summary_length}")

                # Create a summary response from the cached data
                # We still need to get the video info for title and thumbnail
                video_info = await extract_video_info(url)
                
                # Check if there's a database entry for this summary
                existing_summary = await db.summaries.find_one({
                    "video_url": url,
                    "summary_type": request.summary_type,
                    "summary_length": request.summary_length
                })

                if existing_summary:
                    # Return the existing summary with the cached summary text
                    existing_summary["summary_text"] = cached_summary["summary_text"]
                    existing_summary["id"] = str(existing_summary["_id"])
                    return existing_summary

                # If no database entry exists, create one
                now = get_utc_now()
                summary = {
                    "video_url": url,
                    "video_title": video_info.get('title'),
                    "video_thumbnail_url": video_info.get('thumbnail'),
                    "summary_text": cached_summary["summary_text"],
                    "summary_type": request.summary_type,
                    "summary_length": request.summary_length,
                    "transcript_language": video_info.get('transcript_language'),
                    "is_starred": False,
                    "created_at": now,
                    "updated_at": now
                }

                result = await db.summaries.insert_one(summary)
                summary["id"] = str(result.inserted_id)
                return summary

    # Extract video information
    video_info = await extract_video_info(url)
    if not video_info.get('transcript'):
        raise ValueError("No transcript available for this video")

    # Generate summary
    summary_text = await generate_summary(
        video_info.get('transcript', "No transcript available"),
        request.summary_type,
        request.summary_length,
        user_api_key
    )

    # Create summary object
    now = get_utc_now()
    summary = {
        "video_url": url,
        "video_title": video_info.get('title'),
        "video_thumbnail_url": video_info.get('thumbnail'),
        "summary_text": summary_text,
        "summary_type": request.summary_type,
        "summary_length": request.summary_length,
        "transcript_language": video_info.get('transcript_language'),
        "is_starred": False,
        "created_at": now,
        "updated_at": now
    }

    # Insert into database
    result = await db.summaries.insert_one(summary)

    # Cache the summary
    video_id = extract_video_id(url)
    if video_id:
        await cache_summary_result(
            video_id,
            request.summary_type,
            request.summary_length,
            summary_text
        )
        logger.info(f"Cached summary in Redis for video ID {video_id}, type {request.summary_type}, length {request.summary_length}")

    # Return response
    summary["id"] = str(result.inserted_id)
    return summary

async def get_all_summaries(db) -> List[Dict[str, Any]]:
    """Get all stored summaries."""
    summaries = []
    async for summary in db.summaries.find():
        summary["id"] = str(summary["_id"])
        del summary["_id"]
        summaries.append(summary)
    return summaries

async def get_summary_by_id(summary_id: str, db) -> Optional[Dict[str, Any]]:
    """Get a specific summary by ID."""
    try:
        summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        if summary:
            summary["id"] = str(summary["_id"])
            del summary["_id"]
        return summary
    except Exception as e:
        logger.error(f"Error getting summary by ID: {e}")
        return None

async def update_summary(summary_id: str, update: SummaryUpdate, db, user_api_key: str = None) -> Optional[Dict[str, Any]]:
    """Update a summary with new parameters."""
    try:
        # Get the existing summary
        existing_summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        if not existing_summary:
            return None

        # Determine what needs to be updated
        summary_type = update.summary_type or existing_summary["summary_type"]
        summary_length = update.summary_length or existing_summary["summary_length"]

        # Check if we actually need to update
        if summary_type == existing_summary["summary_type"] and summary_length == existing_summary["summary_length"]:
            # No change needed
            existing_summary["id"] = str(existing_summary["_id"])
            del existing_summary["_id"]
            return existing_summary

        # Get video URL and extract video info
        video_url = existing_summary["video_url"]
        video_info = await extract_video_info(video_url)

        # Check if there's a cached summary with the new parameters
        video_id = extract_video_id(video_url)
        if video_id:
            cached_summary = await get_cached_summary(
                video_id,
                summary_type,
                summary_length
            )

            if cached_summary and 'summary_text' in cached_summary:
                logger.info(f"Using cached summary for video ID {video_id}, type {summary_type}, length {summary_length}")
                summary_text = cached_summary["summary_text"]
            else:
                # Generate new summary with user API key if provided
                summary_text = await generate_summary(
                    video_info.get('transcript', "No transcript available"),
                    summary_type,
                    summary_length,
                    user_api_key
                )

                # Cache the new summary
                await cache_summary_result(
                    video_id,
                    summary_type,
                    summary_length,
                    summary_text
                )
        else:
            # Generate new summary with user API key if provided
            summary_text = await generate_summary(
                video_info.get('transcript', "No transcript available"),
                summary_type,
                summary_length,
                user_api_key
            )

        # Update the summary in the database
        now = get_utc_now()
        update_data = {
            "summary_text": summary_text,
            "summary_type": summary_type,
            "summary_length": summary_length,
            "updated_at": now
        }

        await db.summaries.update_one(
            {"_id": ObjectId(summary_id)},
            {"$set": update_data}
        )

        # Get the updated summary
        updated_summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        updated_summary["id"] = str(updated_summary["_id"])
        del updated_summary["_id"]

        return updated_summary
    except Exception as e:
        logger.error(f"Error updating summary: {e}")
        return None

async def delete_summary(summary_id: str, db) -> bool:
    """Delete a summary."""
    try:
        result = await db.summaries.delete_one({"_id": ObjectId(summary_id)})
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"Error deleting summary: {e}")
        return False

async def star_summary(summary_id: str, is_starred: bool, db) -> Optional[Dict[str, Any]]:
    """Star or unstar a summary."""
    try:
        # Update the summary in the database
        now = get_utc_now()
        await db.summaries.update_one(
            {"_id": ObjectId(summary_id)},
            {"$set": {"is_starred": is_starred, "updated_at": now}}
        )

        # Get the updated summary
        updated_summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        if updated_summary:
            updated_summary["id"] = str(updated_summary["_id"])
            del updated_summary["_id"]
        return updated_summary
    except Exception as e:
        logger.error(f"Error starring summary: {e}")
        return None
