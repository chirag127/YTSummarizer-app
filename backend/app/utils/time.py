"""
Time utility functions for the YouTube Summarizer API.

This module provides functions for handling time-related operations.
"""

from datetime import datetime, timezone

def get_utc_now() -> datetime:
    """
    Get current time in UTC timezone.
    
    Returns:
        datetime: Current time in UTC timezone
    """
    return datetime.now(timezone.utc)
