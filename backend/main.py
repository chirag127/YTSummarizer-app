from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime, timezone
import os
import re
import yt_dlp
# Import for client
import google
# Import for configuration types
from google.genai import types
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import logging
from bson import ObjectId
import random

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="YouTube Summarizer API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "youtube_summarizer")

# Gemini API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not set. Summarization will not work.")

# Database connection
client = None

@app.on_event("startup")
async def startup_db_client():
    global client
    try:
        client = AsyncIOMotorClient(MONGODB_URI)
        # Ping the database to check connection
        await client.admin.command('ping')
        logger.info("Connected to MongoDB")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_db_client():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed")

# Helper function to get database
def get_database():
    return client[DATABASE_NAME]

# Models
class SummaryType(str):
    BRIEF = "Brief"
    DETAILED = "Detailed"
    KEY_POINT = "Key Point"
    CHAPTERS = "Chapters"

class SummaryLength(str):
    SHORT = "Short"
    MEDIUM = "Medium"
    LONG = "Long"

class YouTubeURL(BaseModel):
    url: str
    summary_type: str = SummaryType.BRIEF
    summary_length: str = SummaryLength.MEDIUM

class Summary(BaseModel):
    id: Optional[str] = None
    video_url: str
    video_title: Optional[str] = None
    video_thumbnail_url: Optional[str] = None
    summary_text: str
    summary_type: str
    summary_length: str
    transcript_language: Optional[str] = None
    is_starred: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class SummaryResponse(BaseModel):
    id: str
    video_url: str
    video_title: Optional[str] = None
    video_thumbnail_url: Optional[str] = None
    summary_text: str
    summary_type: str
    summary_length: str
    transcript_language: Optional[str] = None
    is_starred: Optional[bool] = False
    created_at: datetime
    updated_at: datetime

class SummaryUpdate(BaseModel):
    summary_type: Optional[str] = None
    summary_length: Optional[str] = None

class StarUpdate(BaseModel):
    is_starred: bool

# Helper functions
def is_valid_youtube_url(url: str) -> bool:
    """Validate if the URL is a YouTube URL."""
    youtube_regex = r'^(https?://)?(www\.|m\.)?(youtube\.com|youtu\.be)/.+$'
    return bool(re.match(youtube_regex, str(url)))

import requests
import re
from urllib.parse import urlparse, parse_qs

def extract_video_id(url: str) -> str:
    """Extract video ID from YouTube URL."""
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
            # Extract the video ID from the path
            video_id = parsed_url.path.split('/')[2]
            # Remove any query parameters
            video_id = video_id.split('?')[0]
            return video_id
    # If we get here, we can't extract the ID
    return None

async def extract_video_info(url: str) -> Dict[str, Any]:
    """Extract video information using yt-dlp."""

    current_dir = os.getcwd()
    logger.info(f"Current working directory: {current_dir}")


    cookies_file = os.path.join(current_dir, 'cookies.txt')
    logger.info(f"Using cookies file: {cookies_file}")

    def get_random_proxy():
        proxies = [os.getenv("PROXY_URL1"), os.getenv("PROXY_URL2"), os.getenv("PROXY_URL3"), os.getenv("PROXY_URL4"), os.getenv("PROXY_URL5"), os.getenv("PROXY_URL6"), os.getenv("PROXY_URL7"), os.getenv("PROXY_URL8"), os.getenv("PROXY_URL9"), os.getenv("PROXY_URL10")]
        return random.choice(proxies)

    def get_random_user_password():
        user_pass = [os.getenv("USER_PASS1"), os.getenv("USER_PASS2"), os.getenv("USER_PASS3"), os.getenv("USER_PASS4"), os.getenv("USER_PASS5"), os.getenv("USER_PASS6"), os.getenv("USER_PASS7"), os.getenv("USER_PASS8"), os.getenv("USER_PASS9")]
        return random.choice(user_pass)

    def get_random_user_password_rotate():
        user_pass = [os.getenv("USER_PASS_ROTATE1"),
                     os.getenv("USER_PASS_ROTATE2"),
                     os.getenv("USER_PASS_ROTATE3"),
                     os.getenv("USER_PASS_ROTATE4"),
                     os.getenv("USER_PASS_ROTATE5"),
                     os.getenv("USER_PASS_ROTATE6"),
                     os.getenv("USER_PASS_ROTATE7"),
                     os.getenv("USER_PASS_ROTATE8"),
                     os.getenv("USER_PASS_ROTATE9"),
                     os.getenv("USER_PASS_ROTATE10")]
        return random.choice(user_pass)

    def get_random_ip_port():
        ip_port = [os.getenv("IP_PORT1"), os.getenv("IP_PORT2"), os.getenv("IP_PORT3"), os.getenv("IP_PORT4"), os.getenv("IP_PORT5"), os.getenv("IP_PORT6"), os.getenv("IP_PORT7"), os.getenv("IP_PORT8"), os.getenv("IP_PORT9"), os.getenv("IP_PORT10")]
        return random.choice(ip_port)

    ydl_opts = {
        # 'quiet': True,
        # 'no_warnings': True,
        'skip_download': True,
        'cookiefile': cookies_file,
        'verbose': True,
                #  'proxy': get_random_proxy(),
                #  'proxy': 'http://177.234.247.234:999/',
                #  'proxy': os.getenv("PROXY_URL"),
        #  'proxy': "http://"+ get_random_user_password() + "@" + get_random_ip_port(),
        "proxy": "http://" + get_random_user_password_rotate() + "@" + "p.webshare.io:80",


        # 'writesubtitles': True,
        # 'writeautomaticsub': True,

        'writesubtitles': True,
        'writeautomaticsub': True,

    }

    # print the current working directory

    # INFO:main:Current working directory: /opt/render/project/src/backend


    # yt-dlp -q --no-warnings --skip-download --writesubtitles --writeautomaticsub --cookies ./cookies.txt "https://www.youtube.com/watch?v=ht8AHzB1VDE"
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            # print(info)
            # Extract relevant information
            video_info = {
                'title': info.get('title', 'Title Unavailable'),
                'thumbnail': info.get('thumbnail', None),
                'transcript': None,
                'transcript_language': None,
                'video_id': info.get('id', extract_video_id(url))
            }

            # Try to get transcript/subtitles
            transcript_text = ""
            transcript_lang = None

            # First try to get manual subtitles
            if info.get('subtitles'):
                # Try English subtitles first (preferred language)
                subs = info.get('subtitles', {}).get('en', [])
                if subs:
                    for format_dict in subs:
                        if format_dict.get('ext') in ['vtt', 'srt']:
                            try:
                                # Download the subtitle file
                                sub_url = format_dict.get('url')
                                response = requests.get(sub_url)
                                if response.status_code == 200:
                                    # Basic parsing of VTT/SRT format
                                    content = response.text
                                    # Remove timing information and formatting
                                    lines = content.split('\n')
                                    for line in lines:
                                        # Skip timing lines, empty lines, and metadata
                                        if re.match(r'^\d+:\d+:\d+', line) or re.match(r'^\d+$', line) or line.strip() == '' or line.startswith('WEBVTT'):
                                            continue
                                        # Remove HTML tags
                                        clean_line = re.sub(r'<[^>]+>', '', line)
                                        if clean_line.strip():
                                            transcript_text += clean_line.strip() + ' '
                                    transcript_lang = 'en'
                                    break
                            except Exception as e:
                                logger.error(f"Error downloading English subtitles: {e}")

                # If no English subtitles, try any other available language
                if not transcript_text:
                    # Get all available subtitle languages
                    available_langs = list(info.get('subtitles', {}).keys())
                    logger.info(f"Available subtitle languages: {available_langs}")

                    # Try each language until we find one that works
                    for lang in available_langs:
                        if lang == 'en':  # Already tried English
                            continue

                        subs = info.get('subtitles', {}).get(lang, [])
                        if subs:
                            for format_dict in subs:
                                if format_dict.get('ext') in ['vtt', 'srt']:
                                    try:
                                        # Download the subtitle file
                                        sub_url = format_dict.get('url')
                                        response = requests.get(sub_url)
                                        if response.status_code == 200:
                                            # Basic parsing of VTT/SRT format
                                            content = response.text
                                            # Remove timing information and formatting
                                            lines = content.split('\n')
                                            for line in lines:
                                                # Skip timing lines, empty lines, and metadata
                                                if re.match(r'^\d+:\d+:\d+', line) or re.match(r'^\d+$', line) or line.strip() == '' or line.startswith('WEBVTT'):
                                                    continue
                                                # Remove HTML tags
                                                clean_line = re.sub(r'<[^>]+>', '', line)
                                                if clean_line.strip():
                                                    transcript_text += clean_line.strip() + ' '
                                            transcript_lang = lang
                                            logger.info(f"Using subtitles in language: {lang}")
                                            break
                                    except Exception as e:
                                        logger.error(f"Error downloading {lang} subtitles: {e}")

                        if transcript_text:  # If we found a transcript, stop trying other languages
                            break

            # If no manual subtitles, try auto-generated captions
            if not transcript_text and info.get('automatic_captions'):
                # Try English auto-captions first (preferred language)
                auto_subs = info.get('automatic_captions', {}).get('en', [])
                if auto_subs:
                    for format_dict in auto_subs:
                        if format_dict.get('ext') in ['vtt', 'srt']:
                            try:
                                # Download the subtitle file
                                sub_url = format_dict.get('url')
                                response = requests.get(sub_url)
                                if response.status_code == 200:
                                    # Basic parsing of VTT/SRT format
                                    content = response.text
                                    # Remove timing information and formatting
                                    lines = content.split('\n')
                                    for line in lines:
                                        # Skip timing lines, empty lines, and metadata
                                        if re.match(r'^\d+:\d+:\d+', line) or re.match(r'^\d+$', line) or line.strip() == '' or line.startswith('WEBVTT'):
                                            continue
                                        # Remove HTML tags
                                        clean_line = re.sub(r'<[^>]+>', '', line)
                                        if clean_line.strip():
                                            transcript_text += clean_line.strip() + ' '
                                    transcript_lang = 'en'
                                    break
                            except Exception as e:
                                logger.error(f"Error downloading English auto captions: {e}")

                # If no English auto-captions, try any other available language
                if not transcript_text:
                    # Get all available auto-caption languages
                    available_langs = list(info.get('automatic_captions', {}).keys())
                    logger.info(f"Available auto-caption languages: {available_langs}")

                    # Try each language until we find one that works
                    for lang in available_langs:
                        if lang == 'en':  # Already tried English
                            continue

                        auto_subs = info.get('automatic_captions', {}).get(lang, [])
                        if auto_subs:
                            for format_dict in auto_subs:
                                if format_dict.get('ext') in ['vtt', 'srt']:
                                    try:
                                        # Download the subtitle file
                                        sub_url = format_dict.get('url')
                                        response = requests.get(sub_url)
                                        if response.status_code == 200:
                                            # Basic parsing of VTT/SRT format
                                            content = response.text
                                            # Remove timing information and formatting
                                            lines = content.split('\n')
                                            for line in lines:
                                                # Skip timing lines, empty lines, and metadata
                                                if re.match(r'^\d+:\d+:\d+', line) or re.match(r'^\d+$', line) or line.strip() == '' or line.startswith('WEBVTT'):
                                                    continue
                                                # Remove HTML tags
                                                clean_line = re.sub(r'<[^>]+>', '', line)
                                                if clean_line.strip():
                                                    transcript_text += clean_line.strip() + ' '
                                            transcript_lang = lang
                                            logger.info(f"Using auto-captions in language: {lang}")
                                            break
                                    except Exception as e:
                                        logger.error(f"Error downloading {lang} auto captions: {e}")

                        if transcript_text:  # If we found a transcript, stop trying other languages
                            break

            # If we still don't have a transcript, try using the YouTube transcript API as a fallback
            if not transcript_text and video_info['video_id']:
                video_id = video_info['video_id']

                # First try English
                try:
                    # Try to get English transcript using YouTube's transcript API
                    transcript_url = f"https://www.youtube.com/api/timedtext?lang=en&v={video_id}"
                    response = requests.get(transcript_url)
                    if response.status_code == 200 and response.text:
                        # Parse the XML response
                        content = response.text
                        # Extract text from XML
                        text_matches = re.findall(r'<text[^>]*>(.*?)</text>', content)
                        for text in text_matches:
                            # Decode HTML entities
                            decoded_text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#39;', "'")
                            transcript_text += decoded_text + ' '
                        transcript_lang = 'en'
                except Exception as e:
                    logger.error(f"Error using YouTube transcript API (English): {e}")

                # If English transcript not available, try to get a list of available languages
                if not transcript_text:
                    try:
                        # Get list of available languages
                        lang_list_url = f"https://www.youtube.com/api/timedtext?type=list&v={video_id}"
                        response = requests.get(lang_list_url)
                        if response.status_code == 200 and response.text:
                            # Extract language codes from XML
                            lang_codes = re.findall(r'lang_code="([^"]+)"', response.text)
                            logger.info(f"Available transcript languages: {lang_codes}")

                            # Try each language until we find one that works
                            for lang in lang_codes:
                                if lang == 'en':  # Already tried English
                                    continue

                                try:
                                    transcript_url = f"https://www.youtube.com/api/timedtext?lang={lang}&v={video_id}"
                                    response = requests.get(transcript_url)
                                    if response.status_code == 200 and response.text:
                                        # Parse the XML response
                                        content = response.text
                                        # Extract text from XML
                                        text_matches = re.findall(r'<text[^>]*>(.*?)</text>', content)
                                        for text in text_matches:
                                            # Decode HTML entities
                                            decoded_text = text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#39;', "'")
                                            transcript_text += decoded_text + ' '
                                        transcript_lang = lang
                                        logger.info(f"Using transcript in language: {lang}")
                                        break
                                except Exception as e:
                                    logger.error(f"Error using YouTube transcript API for language {lang}: {e}")

                                if transcript_text:  # If we found a transcript, stop trying other languages
                                    break
                    except Exception as e:
                        logger.error(f"Error getting available transcript languages: {e}")

            # If we have a transcript, add it to the video info
            if transcript_text:
                video_info['transcript'] = transcript_text.strip()
                video_info['transcript_language'] = transcript_lang

            # If we still don't have a transcript, try a simulated transcript with video description
            if not video_info.get('transcript') and info.get('description'):
                description = info.get('description', '')
                if len(description) > 200:  # Only use description if it's substantial
                    video_info['transcript'] = f"Video Description: {description}"
                    video_info['transcript_language'] = info.get('language') or 'unknown'
                    video_info['is_description_only'] = True

            return video_info
    except Exception as e:
        logger.error(f"Error extracting video info: {e}")
        return {
            'title': 'Title Unavailable',
            'thumbnail': None,
            'transcript': None,
            'error': str(e)
        }

async def generate_summary(transcript: str, summary_type: str, summary_length: str) -> str:
    """Generate summary using Gemini API."""
    if not GEMINI_API_KEY:
        return "API key not configured. Unable to generate summary."
    print("Generating summary...")
    # print(f"Transcript: {transcript}")
    try:
        # Create Gemini client
        client = google.genai.Client(api_key=GEMINI_API_KEY)
        # model = "gemini-2.0-flash-lite"
        model="gemini-2.5-flash-preview-04-17"


        # Adjust prompt based on summary type and length
        length_words = {
            SummaryLength.SHORT: "100-150 words",
            SummaryLength.MEDIUM: "200-300 words",
            SummaryLength.LONG: "400-600 words"
        }

        type_instruction = {
            SummaryType.BRIEF: "Create a concise overview",
            SummaryType.DETAILED: "Create a comprehensive summary with key details",
            SummaryType.KEY_POINT: "Extract and list the main points in bullet form",
            SummaryType.CHAPTERS: "Divide the content into logical chapters with timestamps (if available) and provide a brief summary for each chapter"
        }

        prompt = f"""
        Based on the following transcript from a YouTube video, {type_instruction.get(summary_type, "create a summary")}.
        The summary should be approximately {length_words.get(summary_length, "200-300 words")} in length.
        Format the output in Markdown with appropriate headings, bullet points, and emphasis where needed.
        do not include ```markdown at the start and end of the summary.
        IMPORTANT: Always generate the summary in English, regardless of the language of the transcript.

        {"For chapter-based summaries, identify logical sections in the content and create a chapter for each major topic or segment. Format each chapter with a clear heading that includes a timestamp (if you can identify it from the transcript) and a brief title. Under each chapter heading, provide a concise summary of that section." if summary_type == SummaryType.CHAPTERS else ""}

        IMPORTANT: Exclude the following types of content from your summary:
        - Sponsor segments (paid promotions or advertisements)
        - Interaction reminders (like, subscribe, comment requests)
        - Unpaid/Self Promotion (merchandise, Patreon, personal projects)
        - Intro/outro animations or intermissions
        - End cards and credits
        - Preview/recap hooks for other content
        - Tangents, jokes, or skits unrelated to the main content
        - Non-essential music sections in non-music videos

        Focus only on the substantive, informative content of the video.

        TRANSCRIPT:
        {transcript}
        """

        # Create content using the new API format
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=prompt)]
            )
        ]

        # Configure generation parameters
        generate_content_config = types.GenerateContentConfig(
            response_mime_type="text/plain"
        )

        # Generate content
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config
        )

        return response.text
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        return f"Failed to generate summary: {str(e)}"

# API Endpoints
@app.get("/")
async def root():
    return {"message": "YouTube Summarizer API is running"}

@app.post("/validate-url", response_model=Dict[str, Any])
async def validate_url(youtube_url: YouTubeURL):
    """Validate YouTube URL and extract basic information."""
    url = str(youtube_url.url)

    if not is_valid_youtube_url(url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    try:
        video_info = await extract_video_info(url)

        if not video_info.get('transcript'):
            return {
                "valid": True,
                "has_transcript": False,
                "title": video_info.get('title'),
                "thumbnail": video_info.get('thumbnail'),
                "message": "Video found, but no transcript/captions available for summarization."
            }

        return {
            "valid": True,
            "has_transcript": True,
            "title": video_info.get('title'),
            "thumbnail": video_info.get('thumbnail'),
            "transcript_language": video_info.get('transcript_language'),
            "message": "Valid YouTube URL with available transcript."
        }
    except Exception as e:
        logger.error(f"Error validating URL: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing URL: {str(e)}")

@app.post("/generate-summary", response_model=SummaryResponse)
async def create_summary(youtube_url: YouTubeURL, db=Depends(get_database)):
    """Generate summary for a YouTube video and store it."""
    url = str(youtube_url.url)

    if not is_valid_youtube_url(url):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL")

    # Check if summary already exists
    existing_summary = await db.summaries.find_one({"video_url": url})
    if existing_summary:
        # Convert ObjectId to string for response
        existing_summary["id"] = str(existing_summary.pop("_id"))
        return SummaryResponse(**existing_summary)

    # Extract video information
    video_info = await extract_video_info(url)

    # print(video_info)

    if not video_info.get('transcript'):
        raise HTTPException(
            status_code=400,
            detail="No transcript/captions available for this video. Cannot generate summary."
        )

    # Generate summary
    summary_text = await generate_summary(
        video_info.get('transcript', "No transcript available"),
        youtube_url.summary_type,
        youtube_url.summary_length
    )

    # Create summary document
    now = datetime.now(timezone.utc)
    summary = {
        "video_url": url,
        "video_title": video_info.get('title', 'Title Unavailable'),
        "video_thumbnail_url": video_info.get('thumbnail'),
        "summary_text": summary_text,
        "summary_type": youtube_url.summary_type,
        "summary_length": youtube_url.summary_length,
        "transcript_language": video_info.get('transcript_language'),
        "is_starred": False,
        "created_at": now,
        "updated_at": now
    }

    # Insert into database
    result = await db.summaries.insert_one(summary)

    # Return response
    summary["id"] = str(result.inserted_id)
    return SummaryResponse(**summary)

@app.get("/summaries", response_model=Dict[str, Any])
async def get_summaries(page: int = 1, limit: int = 100, db=Depends(get_database)):
    """Get summaries with pagination."""
    # Ensure valid pagination parameters
    page = max(1, page)  # Minimum page is 1
    limit = min(max(1, limit), 100)  # Limit between 1 and 100
    skip = (page - 1) * limit

    # Get total count for pagination info
    total_count = await db.summaries.count_documents({})

    # Get paginated summaries
    summaries = []
    async for summary in db.summaries.find().sort("created_at", -1).skip(skip).limit(limit):
        summary["id"] = str(summary.pop("_id"))
        summaries.append(SummaryResponse(**summary))

    # Calculate pagination metadata
    total_pages = (total_count + limit - 1) // limit  # Ceiling division
    has_next = page < total_pages
    has_prev = page > 1

    # Return summaries with pagination metadata
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

@app.get("/summaries/{summary_id}", response_model=SummaryResponse)
async def get_summary(summary_id: str, db=Depends(get_database)):
    """Get a specific summary by ID."""
    try:
        summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        if not summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        summary["id"] = str(summary.pop("_id"))
        return SummaryResponse(**summary)
    except Exception as e:
        logger.error(f"Error retrieving summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving summary: {str(e)}")

@app.put("/summaries/{summary_id}", response_model=SummaryResponse)
async def update_summary(summary_id: str, update_data: SummaryUpdate, db=Depends(get_database)):
    """Update a summary with new parameters and regenerate."""
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

        # Determine new parameters
        summary_type = update_data.summary_type or existing_summary["summary_type"]
        summary_length = update_data.summary_length or existing_summary["summary_length"]

        # Generate new summary
        summary_text = await generate_summary(
            video_info.get('transcript', "No transcript available"),
            summary_type,
            summary_length
        )

        # Update the document
        now = datetime.now(timezone.utc)
        update_fields = {
            "summary_text": summary_text,
            "summary_type": summary_type,
            "summary_length": summary_length,
            "transcript_language": video_info.get('transcript_language'),
            "updated_at": now
        }

        await db.summaries.update_one(
            {"_id": ObjectId(summary_id)},
            {"$set": update_fields}
        )

        # Get the updated summary
        updated_summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        updated_summary["id"] = str(updated_summary.pop("_id"))

        return SummaryResponse(**updated_summary)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating summary: {str(e)}")

@app.patch("/summaries/{summary_id}/star", response_model=SummaryResponse)
async def toggle_star_summary(summary_id: str, star_update: StarUpdate, db=Depends(get_database)):
    """Toggle the star status of a summary."""
    try:
        # Find the existing summary
        existing_summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        if not existing_summary:
            raise HTTPException(status_code=404, detail="Summary not found")

        # Update the star status
        now = datetime.now(timezone.utc)
        await db.summaries.update_one(
            {"_id": ObjectId(summary_id)},
            {"$set": {"is_starred": star_update.is_starred, "updated_at": now}}
        )

        # Get the updated summary
        updated_summary = await db.summaries.find_one({"_id": ObjectId(summary_id)})
        updated_summary["id"] = str(updated_summary.pop("_id"))

        return SummaryResponse(**updated_summary)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating star status: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating star status: {str(e)}")

@app.delete("/summaries/{summary_id}", response_model=Dict[str, str])
async def delete_summary(summary_id: str, db=Depends(get_database)):
    """Delete a summary by ID."""
    try:
        result = await db.summaries.delete_one({"_id": ObjectId(summary_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Summary not found")

        return {"message": "Summary deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting summary: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting summary: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
