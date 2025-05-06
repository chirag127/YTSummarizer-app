"""
Chat routes for the YouTube Summarizer backend.

This module defines API routes for chat-related operations.
"""

from fastapi import APIRouter, HTTPException, Depends

from app.models.chat import VideoQARequest, VideoQAResponse
from app.services.chat_service import process_video_question, get_video_chat_history
from app.api.dependencies import get_database

router = APIRouter(prefix="/api/v1", tags=["chat"])

@router.post("/videos/{video_id}/qa", response_model=VideoQAResponse)
async def ask_video_question(
    video_id: str,
    qa_request: VideoQARequest,
    db=Depends(get_database),
    x_user_api_key: str = None
):
    """Ask a question about a video and get an AI-generated answer."""
    try:
        response = await process_video_question(video_id, qa_request, db, x_user_api_key)
        return VideoQAResponse(**response)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")

@router.get("/videos/{video_id}/qa", response_model=VideoQAResponse)
async def get_video_qa_history(video_id: str, db=Depends(get_database)):
    """Get chat history for a video."""
    try:
        response = await get_video_chat_history(video_id, db)
        if not response:
            raise HTTPException(status_code=404, detail="Video chat history not found")
        return VideoQAResponse(**response)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting video chat history: {str(e)}")
