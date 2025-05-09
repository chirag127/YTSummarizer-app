"""
Summary-related API routes for the YouTube Summarizer API.

This module defines the routes for generating and managing summaries.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Dict, Any, Optional
import logging
from bson import ObjectId
from app.models.schemas import YouTubeURL, Summary, SummaryResponse, SummaryUpdate, StarUpdate
from app.services.video import extract_video_info
from app.services.summary import generate_summary
from app.services.database import get_database
from app.utils.url import is_valid_youtube_url
from app.utils.time import get_utc_now

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(tags=["summaries"])

@router.post("/generate-summary", response_model=SummaryResponse)
async def create_summary(youtube_url: YouTubeURL, db=Depends(get_database), x_user_api_key: Optional[str] = Header(None)):
    """Generate summary for a YouTube video and store it.

    The user can optionally provide their own Gemini API key via the X-User-API-Key header.
    """
    url = str(youtube_url.url)

    if not is_valid_youtube_url(url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    # Check if summary already exists with the same URL, type, and length
    existing_summary = await db.summaries.find_one({
        "video_url": url,
        "summary_type": youtube_url.summary_type,
        "summary_length": youtube_url.summary_length
    })

    if existing_summary:
        # Convert ObjectId to string for the response
        existing_summary["id"] = str(existing_summary.pop("_id"))
        return SummaryResponse(**existing_summary)

    # Extract video information
    video_info = await extract_video_info(url)
    if not video_info.get('transcript'):
        raise HTTPException(
            status_code=400,
            detail="No transcript available for this video. Cannot generate summary."
        )

    # Get user API key from header if provided
    user_api_key = x_user_api_key

    # Generate summary with user API key if provided
    try:
        summary_text = await generate_summary(
            video_info.get('transcript', "No transcript available"),
            youtube_url.summary_type,
            youtube_url.summary_length,
            user_api_key
        )
    except Exception as e:
        error_message = str(e)
        logger.error(f"Error generating summary: {error_message}")

        # Check for specific error types
        if "503" in error_message or "UNAVAILABLE" in error_message:
            # Service unavailable error from Gemini API
            raise HTTPException(
                status_code=503,
                detail="The Gemini AI service is currently unavailable. Please try again later."
            )
        elif "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
            # Rate limit or quota exceeded
            raise HTTPException(
                status_code=429,
                detail="AI service quota exceeded or rate limited. Please try again later."
            )
        elif user_api_key:
            # If there's an error with the user's API key
            raise HTTPException(
                status_code=400,
                detail="Failed to generate summary with your API key. Please check if your API key is valid and has sufficient quota."
            )
        else:
            # For other errors, provide a generic message
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate summary: {error_message}"
            )

    # Create summary document
    now = get_utc_now()
    summary = Summary(
        video_url=url,
        video_title=video_info.get('title'),
        video_thumbnail_url=video_info.get('thumbnail'),
        summary_text=summary_text,
        summary_type=youtube_url.summary_type,
        summary_length=youtube_url.summary_length,
        transcript_language=video_info.get('transcript_language'),
        created_at=now,
        updated_at=now
    )

    # Insert into database
    result = await db.summaries.insert_one(summary.model_dump(exclude={"id"}))

    # Return response with ID
    summary_response = SummaryResponse(
        id=str(result.inserted_id),
        **summary.model_dump(exclude={"id"})
    )

    return summary_response

@router.get("/summaries", response_model=Dict[str, Any])
async def get_summaries(
    page: int = 1,
    limit: int = 100,
    video_url: Optional[str] = None,
    is_starred: Optional[bool] = None,
    db=Depends(get_database)
):
    """Get summaries with pagination and filtering.

    Optional query parameters:
    - video_url: If provided, returns all summaries for the specified video URL
    - is_starred: If provided, filters summaries by starred status
    """
    # Ensure valid pagination parameters
    page = max(1, page)  # Minimum page is 1
    limit = min(max(1, limit), 100)  # Limit between 1 and 100
    skip = (page - 1) * limit

    # Build query filter
    query_filter = {}
    if video_url:
        query_filter["video_url"] = video_url
    if is_starred is not None:
        query_filter["is_starred"] = is_starred

    try:
        # Get total count for pagination
        total_count = await db.summaries.count_documents(query_filter)

        # Get summaries with pagination
        summaries = []
        cursor = db.summaries.find(query_filter).sort("created_at", -1).skip(skip).limit(limit)

        async for summary in cursor:
            # Convert ObjectId to string
            summary["id"] = str(summary.pop("_id"))
            summaries.append(SummaryResponse(**summary))

        # Calculate pagination info
        total_pages = (total_count + limit - 1) // limit  # Ceiling division
        has_next = page < total_pages
        has_prev = page > 1

        return {
            "summaries": summaries,
            "pagination": {
                "page": page,
                "limit": limit,
                "total_count": total_count,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_prev": has_prev
            }
        }
    except Exception as e:
        logger.error(f"Error retrieving summaries: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving summaries: {str(e)}")

@router.get("/summaries/{summary_id}", response_model=SummaryResponse)
async def get_summary(summary_id: str, db=Depends(get_database)):
    """Get a specific summary by ID."""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(summary_id):
            raise HTTPException(status_code=400, detail="Invalid summary ID format")

        # Find summary by ID
        summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        # Convert ObjectId to string
        summary["id"] = str(summary.pop("_id"))
        return SummaryResponse(**summary)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving summary: {str(e)}")

@router.put("/summaries/{summary_id}", response_model=SummaryResponse)
async def update_summary(
    summary_id: str,
    update_data: SummaryUpdate,
    db=Depends(get_database),
    x_user_api_key: Optional[str] = Header(None)
):
    """Update a summary with new parameters and regenerate if needed."""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(summary_id):
            raise HTTPException(status_code=400, detail="Invalid summary ID format")

        # Find summary by ID
        summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        # Check if we need to update anything
        summary_type = update_data.summary_type or summary.get("summary_type")
        summary_length = update_data.summary_length or summary.get("summary_length")

        # If nothing changed, return the existing summary
        if (summary_type == summary.get("summary_type") and
            summary_length == summary.get("summary_length")):
            summary["id"] = str(summary.pop("_id"))
            return SummaryResponse(**summary)

        # Get video info for regeneration
        video_url = summary.get("video_url")
        video_info = await extract_video_info(video_url)

        if not video_info.get('transcript'):
            raise HTTPException(
                status_code=400,
                detail="No transcript available for this video. Cannot regenerate summary."
            )

        # Get user API key from header if provided
        user_api_key = x_user_api_key

        # Generate new summary with user API key if provided
        try:
            summary_text = await generate_summary(
                video_info.get('transcript', "No transcript available"),
                summary_type,
                summary_length,
                user_api_key
            )
        except Exception as e:
            error_message = str(e)
            logger.error(f"Error generating summary: {error_message}")

            # Check for specific error types
            if "503" in error_message or "UNAVAILABLE" in error_message:
                # Service unavailable error from Gemini API
                raise HTTPException(
                    status_code=503,
                    detail="The Gemini AI service is currently unavailable. Please try again later."
                )
            elif "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
                # Rate limit or quota exceeded
                raise HTTPException(
                    status_code=429,
                    detail="AI service quota exceeded or rate limited. Please try again later."
                )
            elif user_api_key:
                # If there's an error with the user's API key
                raise HTTPException(
                    status_code=400,
                    detail="Failed to generate summary with your API key. Please check if your API key is valid and has sufficient quota."
                )
            else:
                # For other errors, provide a generic message
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to generate summary: {error_message}"
                )

        # Update summary in database
        now = get_utc_now()
        update_result = await db.summaries.update_one(
            {"_id": ObjectId(summary_id)},
            {
                "$set": {
                    "summary_text": summary_text,
                    "summary_type": summary_type,
                    "summary_length": summary_length,
                    "updated_at": now
                }
            }
        )

        if update_result.modified_count == 0:
            logger.warning(f"Summary {summary_id} was not modified during update")

        # Get updated summary
        updated_summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        updated_summary["id"] = str(updated_summary.pop("_id"))

        return SummaryResponse(**updated_summary)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating summary: {str(e)}")

@router.delete("/summaries/{summary_id}", response_model=Dict[str, Any])
async def delete_summary(summary_id: str, db=Depends(get_database)):
    """Delete a summary."""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(summary_id):
            raise HTTPException(status_code=400, detail="Invalid summary ID format")

        # Delete summary
        result = await db.summaries.delete_one({"_id": ObjectId(summary_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Summary not found")

        return {"message": "Summary deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting summary: {str(e)}")

@router.patch("/summaries/{summary_id}/star", response_model=SummaryResponse)
async def toggle_star_summary(summary_id: str, star_update: StarUpdate, db=Depends(get_database)):
    """Toggle the star status of a summary."""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(summary_id):
            raise HTTPException(status_code=400, detail="Invalid summary ID format")

        # Update star status
        result = await db.summaries.update_one(
            {"_id": ObjectId(summary_id)},
            {"$set": {"is_starred": star_update.is_starred}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Summary not found")

        # Get updated summary
        updated_summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        updated_summary["id"] = str(updated_summary.pop("_id"))

        return SummaryResponse(**updated_summary)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating star status: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating star status: {str(e)}")

@router.post("/summaries/{summary_id}/regenerate", response_model=SummaryResponse)
async def regenerate_summary(summary_id: str, db=Depends(get_database), x_user_api_key: Optional[str] = Header(None)):
    """Regenerate a summary with the same parameters.

    This endpoint creates a new summary with the same type and length as the existing one,
    but with a fresh generation from the AI model.

    The user can optionally provide their own Gemini API key via the X-User-API-Key header.
    """
    try:
        # Find the existing summary
        existing_summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        if not existing_summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        # Extract video information again
        video_info = await extract_video_info(existing_summary["video_url"])

        if not video_info.get('transcript'):
            raise HTTPException(
                status_code=400,
                detail="No transcript/captions available for this video. Cannot regenerate summary."
            )

        # Get the current parameters
        summary_type = existing_summary["summary_type"]
        summary_length = existing_summary["summary_length"]

        # Get user API key from header if provided
        user_api_key = x_user_api_key

        # Generate new summary with user API key if provided
        try:
            summary_text = await generate_summary(
                video_info.get('transcript', "No transcript available"),
                summary_type,
                summary_length,
                user_api_key
            )
        except Exception as e:
            error_message = str(e)
            logger.error(f"Error generating summary: {error_message}")

            # Check for specific error types
            if "503" in error_message or "UNAVAILABLE" in error_message:
                # Service unavailable error from Gemini API
                raise HTTPException(
                    status_code=503,
                    detail="The Gemini AI service is currently unavailable. Please try again later."
                )
            elif "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
                # Rate limit or quota exceeded
                raise HTTPException(
                    status_code=429,
                    detail="AI service quota exceeded or rate limited. Please try again later."
                )
            elif user_api_key:
                # If there's an error with the user's API key
                raise HTTPException(
                    status_code=400,
                    detail="Failed to generate summary with your API key. Please check if your API key is valid and has sufficient quota."
                )
            else:
                # For other errors, provide a generic message
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to generate summary: {error_message}"
                )

        # Create a new summary document
        now = get_utc_now()
        new_summary = {
            "video_url": existing_summary["video_url"],
            "video_title": existing_summary["video_title"],
            "video_thumbnail_url": existing_summary["video_thumbnail_url"],
            "summary_text": summary_text,
            "summary_type": summary_type,
            "summary_length": summary_length,
            "transcript_language": video_info.get('transcript_language'),
            "is_starred": False,  # New summary starts unstarred
            "created_at": now,
            "updated_at": now
        }

        # Insert the new summary
        result = await db.summaries.insert_one(new_summary)

        # Extract video_id from the URL to clear cache
        from app.utils.url import extract_video_id
        video_id = extract_video_id(existing_summary["video_url"])
        if video_id:
            # Import cache module
            from app.core import cache
            # Clear cache for this video to ensure fresh data is fetched
            try:
                await cache.delete_cache(f"video_info:{video_id}")
                await cache.delete_cache(f"transcript:{video_id}")
                logger.info(f"Cleared cache for video {video_id} after regenerating summary")
            except Exception as cache_error:
                logger.error(f"Error clearing cache after regenerating summary: {cache_error}")

        # Return the new summary with additional metadata to help the frontend
        new_summary["id"] = str(result.inserted_id)

        # Create a response with additional metadata
        response_data = {
            **new_summary,
            "original_summary_id": summary_id,  # Include the original summary ID
            "is_regenerated": True,  # Flag to indicate this is a regenerated summary
            "regenerated_at": now.isoformat()  # Timestamp of regeneration
        }

        # Log the response for debugging
        logger.info(f"Regenerated summary with ID {new_summary['id']} from original ID {summary_id}")

        return SummaryResponse(**response_data)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error regenerating summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error regenerating summary: {str(e)}")

@router.get("/video-summaries", response_model=Dict[str, Any])
async def get_video_summaries(video_url: str, db=Depends(get_database)):
    """Get all summaries for a specific video URL."""
    if not video_url:
        raise HTTPException(status_code=400, detail="Video URL is required")

    try:
        # Find all summaries for the video URL
        summaries = []
        async for summary in db.summaries.find({"video_url": video_url}).sort("created_at", -1):
            summary["id"] = str(summary.pop("_id"))
            summaries.append(SummaryResponse(**summary))

        return {
            "video_url": video_url,
            "summaries": summaries,
            "count": len(summaries)
        }
    except Exception as e:
        logger.error(f"Error retrieving video summaries: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving video summaries: {str(e)}")
