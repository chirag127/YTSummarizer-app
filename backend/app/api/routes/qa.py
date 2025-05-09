"""
Question-Answering API routes for the YouTube Summarizer API.

This module defines the routes for the Q&A functionality.
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
import logging
from app.models.schemas import VideoQARequest, VideoQAResponse, ChatMessage, ChatMessageRole
from app.services.video import extract_video_info
from app.services.qa import generate_qa_response
from app.services.database import get_database, ensure_indexes
from app.utils.time import get_utc_now
from app.core import cache, token_management

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/v1", tags=["qa"])

@router.get("/videos/{video_id}/qa", response_model=VideoQAResponse)
async def get_video_qa_history(video_id: str, db=Depends(get_database)):
    """Get conversation history for a specific video."""
    # Ensure database indexes are created
    await ensure_indexes()
    try:
        # Use projection to get only the fields we need
        chat_projection = {
            "videoId": 1,
            "video_title": 1,
            "video_thumbnail_url": 1,
            "video_url": 1,
            "history": 1,
            "token_count": 1,
            "transcript_token_count": 1
        }

        # Find the chat history for this video using the index
        chat = await db.video_chats.find_one(
            {"videoId": video_id},
            projection=chat_projection
        )

        if not chat:
            # If no chat history exists, create a basic response
            # Try to find a summary for this video to get the URL
            summary = await db.summaries.find_one({"video_url": {"$regex": video_id}})
            video_url = None
            video_title = None
            video_thumbnail_url = None

            if summary:
                video_url = summary.get("video_url")
                video_title = summary.get("video_title")
                video_thumbnail_url = summary.get("video_thumbnail_url")
            else:
                # If no summary found, construct a URL
                video_url = f"https://www.youtube.com/watch?v={video_id}"

                # Try to get video info
                try:
                    video_info = await extract_video_info(video_url)
                    video_title = video_info.get('title')
                    video_thumbnail_url = video_info.get('thumbnail')
                except Exception as e:
                    logger.error(f"Error getting video info for {video_id}: {e}")
                    # Continue without video info

            # Check if we have a transcript
            has_transcript = False
            transcript_token_count = 0

            # Check if we have cached transcript
            cached_transcript = await cache.get_cached_transcript(video_id)
            if cached_transcript and cached_transcript.get('transcript'):
                has_transcript = True
                transcript_token_count = token_management.count_tokens(cached_transcript.get('transcript', ''))
            elif video_url:
                # Try to get video info directly
                try:
                    video_info = await extract_video_info(video_url)
                    has_transcript = bool(video_info.get('transcript'))
                    if has_transcript:
                        transcript_token_count = token_management.count_tokens(video_info.get('transcript', ''))
                except Exception as e:
                    logger.error(f"Error checking transcript for {video_id}: {e}")

            return VideoQAResponse(
                video_id=video_id,
                video_title=video_title,
                video_thumbnail_url=video_thumbnail_url,
                history=[],
                has_transcript=has_transcript,
                token_count=0,
                transcript_token_count=transcript_token_count
            )

        # If chat history exists, return it
        # Convert history dictionaries to ChatMessage objects
        history = []
        for msg in chat.get("history", []):
            if isinstance(msg, dict):
                history.append(ChatMessage(**msg))

        return VideoQAResponse(
            video_id=chat["videoId"],
            video_title=chat.get("video_title"),
            video_thumbnail_url=chat.get("video_thumbnail_url"),
            history=history,
            has_transcript=True,  # If chat exists, we must have had a transcript
            token_count=chat.get("token_count", 0),
            transcript_token_count=chat.get("transcript_token_count", 0)
        )
    except Exception as e:
        logger.error(f"Error retrieving chat history: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving chat history: {str(e)}")

@router.post("/videos/{video_id}/qa", response_model=VideoQAResponse)
async def ask_video_question(
    video_id: str,
    qa_request: VideoQARequest,
    db=Depends(get_database),
    x_user_api_key: Optional[str] = Header(None)
):
    """Ask a question about a video and get an AI-generated answer."""
    try:
        # Get video URL from video ID
        video_url = None

        # Try to find a summary for this video to get the URL
        summary = await db.summaries.find_one({"video_url": {"$regex": video_id}})
        if summary:
            video_url = summary.get("video_url")

        # If no URL found, try to construct one
        if not video_url:
            video_url = f"https://www.youtube.com/watch?v={video_id}"

        # Get video info
        video_info = await extract_video_info(video_url)
        if not video_info.get('transcript'):
            raise HTTPException(
                status_code=400,
                detail="No transcript available for this video. Cannot answer questions."
            )

        # Get or create chat history
        chat = await db.video_chats.find_one({"videoId": video_id})

        # Initialize history
        history = list(qa_request.history or []) if qa_request.history else []
        if chat and chat.get("history"):
            # If we have existing history and no history was provided in the request,
            # use the existing history
            if not qa_request.history:
                # Convert history dictionaries to ChatMessage objects
                history = []
                for msg in chat.get("history", []):
                    if isinstance(msg, dict):
                        history.append(ChatMessage(**msg))

        # Add the new question to history
        user_message = ChatMessage(role=ChatMessageRole.USER, content=qa_request.question)
        history.append(user_message)

        # Count tokens for logging
        question_tokens = token_management.count_tokens(qa_request.question)
        # Calculate history tokens correctly based on the type of history items
        history_tokens = 0
        if len(history) > 1:
            for msg in history[:-1]:
                if isinstance(msg, dict):
                    history_tokens += token_management.count_tokens(msg.get("content", ""))
                elif isinstance(msg, ChatMessage):
                    history_tokens += token_management.count_tokens(msg.content)
        transcript_tokens = token_management.count_tokens(video_info.get('transcript', ''))

        logger.info(f"Question tokens: {question_tokens}, History tokens: {history_tokens}, Transcript tokens: {transcript_tokens}")

        # Calculate total tokens
        total_tokens = question_tokens + history_tokens

        # Generate answer using Gemini with token management
        try:
            answer = await generate_qa_response(
                video_info.get('transcript'),
                qa_request.question,
                history[:-1],  # Exclude the question we just added
                x_user_api_key
            )

            # Check if the answer contains error messages
            if "Failed to generate answer:" in answer:
                error_message = answer
                logger.error(f"Error in QA response: {error_message}")

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
                elif x_user_api_key and "API key" in error_message:
                    # If there's an error with the user's API key
                    raise HTTPException(
                        status_code=400,
                        detail="Failed to generate answer with your API key. Please check if your API key is valid and has sufficient quota."
                    )
        except HTTPException:
            raise
        except Exception as e:
            error_message = str(e)
            logger.error(f"Error generating QA response: {error_message}")

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
            elif x_user_api_key:
                # If there's an error with the user's API key
                raise HTTPException(
                    status_code=400,
                    detail="Failed to generate answer with your API key. Please check if your API key is valid and has sufficient quota."
                )
            else:
                # For other errors, provide a generic message
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to generate answer: {error_message}"
                )

        # Add the answer to history
        model_message = ChatMessage(role=ChatMessageRole.MODEL, content=answer)
        history.append(model_message)

        # Log token usage after adding new answer
        total_tokens = transcript_tokens + question_tokens + history_tokens + token_management.count_tokens(answer)
        logger.info(f"Total token usage after processing: {total_tokens}")

        # Update or create chat history in database
        now = get_utc_now()

        # Convert ChatMessage objects to dictionaries for MongoDB storage
        history_dicts = []
        for msg in history:
            if isinstance(msg, ChatMessage):
                # Use model_dump() to convert Pydantic model to dict
                history_dicts.append(msg.model_dump())
            elif isinstance(msg, dict):
                history_dicts.append(msg)

        if chat:
            # Update existing chat
            await db.video_chats.update_one(
                {"videoId": video_id},
                {
                    "$set": {
                        "history": history_dicts,
                        "updatedAt": now,
                        "token_count": total_tokens,
                        "transcript_token_count": transcript_tokens
                    }
                }
            )
        else:
            # Create new chat
            await db.video_chats.insert_one({
                "videoId": video_id,
                "video_url": video_url,
                "video_title": video_info.get('title'),
                "video_thumbnail_url": video_info.get('thumbnail'),
                "history": history_dicts,
                "createdAt": now,
                "updatedAt": now,
                "token_count": total_tokens,
                "transcript_token_count": transcript_tokens
            })

        # Return response
        return VideoQAResponse(
            video_id=video_id,
            video_title=video_info.get('title'),
            video_thumbnail_url=video_info.get('thumbnail'),
            history=history,
            has_transcript=True,
            token_count=total_tokens,  # Include the calculated token count
            transcript_token_count=transcript_tokens  # Include the transcript token count
        )
    except Exception as e:
        logger.error(f"Error processing question: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")
