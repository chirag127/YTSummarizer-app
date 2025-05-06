"""
Summary routes for the YouTube Summarizer backend.

This module defines API routes for summary-related operations.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any

from app.models.summary import SummaryRequest, SummaryResponse, SummaryUpdate, StarUpdate
from app.services.summary_service import create_summary, get_all_summaries, get_summary_by_id, update_summary, delete_summary, star_summary
from app.api.dependencies import get_database

router = APIRouter(prefix="/summaries", tags=["summaries"])

@router.post("/", response_model=SummaryResponse)
async def create_summary_endpoint(request: SummaryRequest, db=Depends(get_database), x_user_api_key: str = None):
    """Generate summary for a YouTube video and store it."""
    try:
        summary = await create_summary(request, db, x_user_api_key)
        return summary
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")

@router.get("/", response_model=List[SummaryResponse])
async def get_summaries(db=Depends(get_database)):
    """Get all stored summaries."""
    return await get_all_summaries(db)

@router.get("/{summary_id}", response_model=SummaryResponse)
async def get_summary(summary_id: str, db=Depends(get_database)):
    """Get a specific summary by ID."""
    summary = await get_summary_by_id(summary_id, db)
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    return summary

@router.put("/{summary_id}", response_model=SummaryResponse)
async def update_summary_endpoint(summary_id: str, update: SummaryUpdate, db=Depends(get_database), x_user_api_key: str = None):
    """Update a summary with new parameters."""
    summary = await update_summary(summary_id, update, db, x_user_api_key)
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    return summary

@router.delete("/{summary_id}", response_model=Dict[str, Any])
async def delete_summary_endpoint(summary_id: str, db=Depends(get_database)):
    """Delete a summary."""
    result = await delete_summary(summary_id, db)
    if not result:
        raise HTTPException(status_code=404, detail="Summary not found")
    return {"message": "Summary deleted successfully"}

@router.put("/{summary_id}/star", response_model=SummaryResponse)
async def star_summary_endpoint(summary_id: str, star: StarUpdate, db=Depends(get_database)):
    """Star or unstar a summary."""
    summary = await star_summary(summary_id, star.is_starred, db)
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    return summary
