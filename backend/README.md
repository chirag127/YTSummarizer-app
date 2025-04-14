# YouTube Summarizer Backend

This is the backend service for the YouTube Summarizer application. It provides API endpoints for validating YouTube URLs, generating summaries using Gemini 2.0 Flash-Lite AI, and managing summary data.

## Features

- YouTube URL validation
- Video metadata extraction using yt-dlp
- Transcript/caption extraction
- AI-powered summarization using Gemini 2.0 Flash-Lite
- MongoDB integration for data persistence
- RESTful API with FastAPI

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

- `GET /`: Health check
- `POST /validate-url`: Validate a YouTube URL and check for transcript availability
- `POST /generate-summary`: Generate a summary for a YouTube video
- `GET /summaries`: Get all stored summaries
- `GET /summaries/{summary_id}`: Get a specific summary by ID
- `PUT /summaries/{summary_id}`: Update a summary with new parameters
- `DELETE /summaries/{summary_id}`: Delete a summary

## Dependencies

- FastAPI: Web framework
- uvicorn: ASGI server
- yt-dlp: YouTube video metadata and transcript extraction
- google-generativeai: Gemini AI API client
- motor: Asynchronous MongoDB driver
- python-dotenv: Environment variable management
