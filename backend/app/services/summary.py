"""
Summary service for the YouTube Summarizer API.

This module provides functions for generating summaries using the Gemini API.
"""

import logging
import google
from google.genai import types
from app.config import GEMINI_API_KEY
from app.models.schemas import SummaryLength, SummaryType

# Configure logging
logger = logging.getLogger(__name__)

async def generate_summary(transcript: str, summary_type: SummaryType, summary_length: SummaryLength, user_api_key: str = None) -> str:
    """Generate summary using Gemini API.

    Args:
        transcript: The video transcript text
        summary_type: The type of summary to generate
        summary_length: The desired length of the summary
        user_api_key: Optional user-provided API key

    Returns:
        The generated summary text
    """
    # Use user-provided API key if available, otherwise use the default key
    api_key = user_api_key if user_api_key else GEMINI_API_KEY

    if not api_key:
        return "API key not configured. Unable to generate summary."

    print("Generating summary...")
    # print(f"Transcript: {transcript}")
    try:
        # Create Gemini client with the appropriate API key
        client = google.genai.Client(api_key=api_key)

        # Try to use gemini-2.5-flash-preview-04-17 first, but fall back to gemini-2.0-flash-lite if unavailable
        primary_model = "gemini-2.5-flash-preview-04-17"
        fallback_model = "gemini-2.0-flash-lite"

        # Start with the primary model
        model = primary_model


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
        thinking_config = types.ThinkingConfig(
            thinking_budget=0,
        ),
        response_mime_type="text/plain",
        )

        # Try with primary model first
        try:
            logger.info(f"Attempting to generate summary with model: {model}")
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=generate_content_config
            )
            return response.text
        except Exception as primary_error:
            error_message = str(primary_error)
            logger.warning(f"Error with primary model: {error_message}")

            # Check if it's a service unavailable error
            if "503" in error_message or "UNAVAILABLE" in error_message:
                logger.info(f"Primary model unavailable, trying fallback model: {fallback_model}")
                try:
                    # Try with fallback model
                    response = client.models.generate_content(
                        model=fallback_model,
                        contents=contents,
                        config=generate_content_config
                    )
                    logger.info("Successfully generated summary with fallback model")
                    return response.text
                except Exception as fallback_error:
                    logger.error(f"Error with fallback model: {fallback_error}")
                    return f"Failed to generate summary: {str(fallback_error)}"
            else:
                # For other errors, just return the original error
                return f"Failed to generate summary: {error_message}"
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        return f"Failed to generate summary: {str(e)}"
