"""
URL utility functions for the YouTube Summarizer API.

This module provides functions for validating and processing YouTube URLs.
"""

import re
from urllib.parse import urlparse, parse_qs
import logging

# Configure logging
logger = logging.getLogger(__name__)

def is_valid_youtube_url(url: str) -> bool:
    """
    Validate if the URL is a YouTube URL.
    
    Args:
        url: The URL to validate
        
    Returns:
        bool: True if the URL is a valid YouTube URL, False otherwise
    """
    youtube_regex = r'^(https?://)?(www\.|m\.)?(youtube\.com|youtu\.be)/.+$'
    return bool(re.match(youtube_regex, str(url)))

def extract_video_id(url: str) -> str:
    """
    Extract video ID from YouTube URL.
    
    Args:
        url: The YouTube URL
        
    Returns:
        str: The video ID or empty string if not found
    """
    parsed_url = urlparse(url)
    if parsed_url.netloc == 'youtu.be':
        # Handle youtu.be URLs with query parameters
        # Extract only the path without query parameters
        video_id = parsed_url.path.lstrip('/')
        # Split at any potential query parameter
        video_id = video_id.split('?')[0]
        return video_id
    elif parsed_url.netloc in ('www.youtube.com', 'youtube.com', 'm.youtube.com'):
        if parsed_url.path == '/watch':
            return parse_qs(parsed_url.query)['v'][0]
        elif parsed_url.path.startswith('/embed/'):
            return parsed_url.path.split('/')[2]
        elif parsed_url.path.startswith('/v/'):
            return parsed_url.path.split('/')[2]
        elif parsed_url.path.startswith('/live/'):
            # Handle /live/ format URLs
            return parsed_url.path.split('/')[2]
    
    # If we get here, we couldn't extract the video ID
    logger.warning(f"Could not extract video ID from URL: {url}")
    return ""
