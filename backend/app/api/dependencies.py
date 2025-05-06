"""
API dependencies for the YouTube Summarizer backend.

This module provides dependency functions for the API routes.
"""

from app.db.mongodb import get_database

# Re-export dependencies
__all__ = ['get_database']
