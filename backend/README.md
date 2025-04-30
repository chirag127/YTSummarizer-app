# YouTube Summarizer Backend

This is the backend service for the YouTube Summarizer application. It provides API endpoints for validating YouTube URLs, generating summaries using Gemini 2.0 Flash-Lite AI, and managing summary data.

## Features

-   YouTube URL validation
-   Video metadata extraction using yt-dlp
-   Transcript/caption extraction
-   AI-powered summarization using Gemini 2.0 Flash-Lite
-   MongoDB integration for data persistence
-   Redis-based caching system for transcripts and video metadata
-   RESTful API with FastAPI

## Setup

1. Install dependencies:

    ```
    pip install -r requirements.txt
    ```

2. Create a `.env` file based on `.env.example` and add your configuration:

    ```
    MONGODB_URI=mongodb://localhost:27017
    DATABASE_NAME=youtube_summarizer
    GEMINI_API_KEY=your_gemini_api_key_here

    # Redis cache configuration
    REDIS_URL=redis://localhost:6379
    MAX_MEMORY_PERCENT=90.0  # Trigger cleanup when memory usage exceeds 90%
    MAX_CACHE_KEYS=10000     # Maximum number of keys to keep in cache
    ```

3. Run the server:

    ```
    python run.py
    ```

    Or using uvicorn directly:

    ```
    uvicorn main:app --reload
    ```

4. Access the API documentation at `http://localhost:8000/docs`

## API Endpoints

-   `GET /`: Health check
-   `POST /validate-url`: Validate a YouTube URL and check for transcript availability
-   `POST /generate-summary`: Generate a summary for a YouTube video
-   `GET /summaries`: Get all stored summaries
-   `GET /summaries/{summary_id}`: Get a specific summary by ID
-   `PUT /summaries/{summary_id}`: Update a summary with new parameters
-   `DELETE /summaries/{summary_id}`: Delete a summary
-   `GET /video-summaries`: Get all summaries for a specific video URL

### Cache Management Endpoints

-   `DELETE /cache`: Clear all cached data
-   `DELETE /cache/video/{video_id}`: Clear cached data for a specific video
-   `GET /cache/status`: Get cache status information

## Caching System

The backend implements a Redis-based caching system for transcripts and video metadata to improve performance and reduce API calls to YouTube. Key features:

-   **Transcript Caching**: Transcripts are cached separately and reused when the same video is requested multiple times
-   **Video Metadata Caching**: Basic video information (title, thumbnail URL) is cached
-   **Permanent Storage**: Cached data remains indefinitely until memory limits are reached
-   **LRU Memory Management**: When memory usage exceeds configured thresholds, the least recently used items are removed
-   **Cache Management**: API endpoints for clearing cache and checking cache status

The caching system significantly reduces the load time for previously accessed videos and helps avoid rate limiting from YouTube's API. The LRU (Least Recently Used) algorithm ensures that the most frequently accessed videos remain in cache while older, less used videos are removed when memory limits are reached.

## Dependencies

-   FastAPI: Web framework
-   uvicorn: ASGI server
-   yt-dlp: YouTube video metadata and transcript extraction
-   google-generativeai: Gemini AI API client
-   motor: Asynchronous MongoDB driver
-   redis/aioredis: Redis client for caching
-   python-dotenv: Environment variable management
