"""
Chat service for the YouTube Summarizer backend.

This module provides functions for handling video Q&A functionality.
"""

from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.config import logger
from app.models.chat import ChatMessage, ChatMessageRole, VideoQARequest
from app.services.video_service import extract_video_info, extract_video_id
from app.services.ai_service import generate_qa_response
from app.utils.token_management import count_tokens

def get_utc_now():
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)

async def process_video_question(video_id: str, qa_request: VideoQARequest, db, user_api_key: str = None) -> Dict[str, Any]:
    """Process a question about a video and generate an answer."""
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

        # Get video information
        video_info = await extract_video_info(video_url)
        if not video_info.get('transcript'):
            raise ValueError("No transcript available for this video")

        # Get existing chat history or create new one
        chat = await db.video_chats.find_one({"videoId": video_id})
        
        # Initialize history
        history = []
        
        if chat:
            # Convert stored history to ChatMessage objects
            for msg in chat.get("history", []):
                history.append(ChatMessage(
                    role=msg.get("role"),
                    content=msg.get("content"),
                    timestamp=msg.get("timestamp", get_utc_now())
                ))
        
        # If no history provided in request, use existing history
        if not qa_request.history:
            # Use existing history from database
            pass
        else:
            # Use history from request
            history = qa_request.history

        # Log token usage before adding new question
        transcript_tokens = count_tokens(video_info.get('transcript', ''))
        question_tokens = count_tokens(qa_request.question)
        history_tokens = sum(count_tokens(msg.content) for msg in history) if history else 0

        logger.info(f"Token usage before processing - Transcript: {transcript_tokens}, Question: {question_tokens}, History: {history_tokens}")

        # Add the new question to history
        user_message = ChatMessage(role=ChatMessageRole.USER, content=qa_request.question)
        history.append(user_message)

        # Generate answer using Gemini with token management
        answer = await generate_qa_response(
            video_info.get('transcript'),
            qa_request.question,
            history[:-1],  # Exclude the question we just added
            user_api_key
        )

        # Add the answer to history
        model_message = ChatMessage(role=ChatMessageRole.MODEL, content=answer)
        history.append(model_message)

        # Log token usage after adding new answer
        total_tokens = transcript_tokens + question_tokens + history_tokens + count_tokens(answer)
        logger.info(f"Total token usage after processing: {total_tokens}")

        # Update or create chat history in database
        now = get_utc_now()
        
        if chat:
            # Update existing chat
            await db.video_chats.update_one(
                {"videoId": video_id},
                {
                    "$set": {
                        "history": [msg.model_dump() for msg in history],
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
                "video_title": video_info.get('title'),
                "video_thumbnail_url": video_info.get('thumbnail'),
                "video_url": video_url,  # Store the video URL for future reference
                "history": [msg.model_dump() for msg in history],
                "createdAt": now,
                "updatedAt": now,
                "token_count": total_tokens,  # Store token count for monitoring
                "transcript_token_count": transcript_tokens  # Store transcript token count
            })

        # Return response
        return {
            "video_id": video_id,
            "video_title": video_info.get('title'),
            "video_thumbnail_url": video_info.get('thumbnail'),
            "history": history,
            "has_transcript": True,
            "token_count": total_tokens,
            "transcript_token_count": transcript_tokens
        }
    except Exception as e:
        logger.error(f"Error processing question: {e}")
        raise

async def get_video_chat_history(video_id: str, db) -> Optional[Dict[str, Any]]:
    """Get chat history for a video."""
    try:
        chat = await db.video_chats.find_one({"videoId": video_id})
        if not chat:
            # Check if video exists and has a transcript
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            video_info = await extract_video_info(video_url)
            
            # Get video title and thumbnail if available
            video_title = video_info.get('title', 'Unknown Video')
            video_thumbnail_url = video_info.get('thumbnail')
            
            # Always enable transcript for testing
            has_transcript = True
            logger.warning(f"Forcing transcript availability for video ID: {video_id}")

            # Get transcript token count if available
            transcript_token_count = 0
            if video_url:
                video_info = await extract_video_info(video_url)
                if video_info.get('transcript'):
                    transcript_token_count = count_tokens(video_info.get('transcript', ''))
                    logger.info(f"Transcript token count for video ID {video_id}: {transcript_token_count}")

            return {
                "video_id": video_id,
                "video_title": video_title,
                "video_thumbnail_url": video_thumbnail_url,
                "history": [],
                "has_transcript": has_transcript,
                "token_count": 0,  # No tokens used yet for a new conversation
                "transcript_token_count": transcript_token_count
            }
        
        # Convert stored history to ChatMessage objects
        history = []
        for msg in chat.get("history", []):
            history.append(ChatMessage(
                role=msg.get("role"),
                content=msg.get("content"),
                timestamp=msg.get("timestamp", get_utc_now())
            ))
        
        # Get transcript token count if not already stored
        transcript_token_count = chat.get("transcript_token_count", 0)
        if transcript_token_count == 0:
            # Try to get the transcript token count
            video_url = chat.get("video_url") or f"https://www.youtube.com/watch?v={video_id}"
            
            # Get transcript and count tokens
            try:
                video_info = await extract_video_info(video_url)
                if video_info.get('transcript'):
                    transcript_token_count = count_tokens(video_info.get('transcript', ''))
                    logger.info(f"Transcript token count for video ID {video_id}: {transcript_token_count}")

                    # Update the database with the transcript token count
                    await db.video_chats.update_one(
                        {"videoId": video_id},
                        {"$set": {"transcript_token_count": transcript_token_count}}
                    )
            except Exception as e:
                logger.error(f"Error getting transcript token count: {e}")
        
        return {
            "video_id": video_id,
            "video_title": chat.get("video_title"),
            "video_thumbnail_url": chat.get("video_thumbnail_url"),
            "history": history,
            "has_transcript": True,
            "token_count": chat.get("token_count", 0),
            "transcript_token_count": transcript_token_count
        }
    except Exception as e:
        logger.error(f"Error getting video chat history: {e}")
        return None
