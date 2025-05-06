"""
AI service for the YouTube Summarizer backend.

This module provides functions for generating summaries and answering questions
using the Gemini AI model.
"""

from typing import List, Dict, Any
from google import genai
from google.genai import types

from app.config import settings, logger
import token_management  # Import the original token management module

async def generate_qa_response(transcript: str, question: str, history: List[Dict[str, Any]] = None, user_api_key: str = None) -> str:
    """Generate answer to a question about a video using Gemini API.

    Args:
        transcript: The video transcript text
        question: The user's question
        history: Optional list of previous chat messages
        user_api_key: Optional user-provided API key

    Returns:
        The generated answer text
    """
    # Use user-provided API key if available, otherwise use the default key
    api_key = user_api_key if user_api_key else settings.ai.GEMINI_API_KEY

    if not api_key:
        return "API key not configured. Unable to generate answer."

    try:
        # Convert history to the format expected by token_management
        history_for_token_mgmt = []
        if history:
            for msg in history:
                history_for_token_mgmt.append({
                    "role": "user" if msg.role == "user" else "model",
                    "content": msg.content
                })

        # Apply standard token management to transcript
        logger.info("Using standard token management for transcript")
        managed_transcript, managed_history = token_management.prepare_for_model(transcript, question, history_for_token_mgmt)

        # Log token management results
        logger.info(f"Original transcript length: {token_management.count_tokens(transcript)} tokens")
        logger.info(f"Managed transcript length: {token_management.count_tokens(managed_transcript)} tokens")

        # Apply token management to history
        managed_history, _ = token_management.manage_history_tokens(history_for_token_mgmt, question)

        # Log history management results
        logger.info(f"Original history length: {len(history) if history else 0} messages")
        logger.info(f"Managed history length: {len(managed_history)} messages")

        # Create Gemini client with the appropriate API key
        client = genai.Client(api_key=api_key)
        model = "gemini-2.5-flash-preview-04-17"

        # Prepare conversation history for the model
        contents = []

        # Add system message to instruct the model
        system_prompt = f"""
        You are an AI assistant that answers questions about YouTube videos based ONLY on the provided transcript.

        IMPORTANT RULES:
        1. ONLY answer based on information explicitly mentioned in the transcript.
        2. If the answer cannot be found in the transcript, clearly state that the information is not available in the video.
        3. Do not make up or infer information that is not directly stated in the transcript.
        4. Keep answers concise and to the point.
        5. If asked about timestamps or specific moments in the video, try to identify them from context clues in the transcript if possible.
        6. Format your responses in a clear, readable way using Markdown when appropriate.
        """

        system_prompt += f"""
        TRANSCRIPT:
        {managed_transcript}
        """

        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=system_prompt)]))

        # Add managed conversation history
        for msg in managed_history:
            contents.append(types.Content(role=msg["role"], parts=[types.Part.from_text(text=msg["content"])]))

        # Add the current question
        contents.append(types.Content(role="user", parts=[types.Part.from_text(text=question)]))

        # Configure generation parameters
        generate_content_config = types.GenerateContentConfig(
            thinking_config = types.ThinkingConfig(
                thinking_budget=0,
            ),
            response_mime_type="text/plain",
        )

        # Generate content
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=generate_content_config
        )

        # Log the response for debugging
        logger.info(f"Gemini API response: {response}")

        # Check if response has candidates
        if hasattr(response, 'candidates') and response.candidates:
            # Get the first candidate
            candidate = response.candidates[0]

            # Check if candidate has content
            if hasattr(candidate, 'content') and candidate.content:
                # Check if content has parts
                if hasattr(candidate.content, 'parts') and candidate.content.parts:
                    # Get the text from the first part
                    return candidate.content.parts[0].text

        # If we can't extract text using the above method, try the standard way
        if hasattr(response, 'text'):
            return response.text

        # If all else fails, try to convert the response to a string
        return str(response)
    except Exception as e:
        logger.error(f"Error generating answer: {e}")
        return f"Failed to generate answer: {str(e)}"

async def generate_summary(transcript: str, summary_type: str, summary_length: str, user_api_key: str = None) -> str:
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
    api_key = user_api_key if user_api_key else settings.ai.GEMINI_API_KEY

    if not api_key:
        return "API key not configured. Unable to generate summary."

    print("Generating summary...")
    # print(f"Transcript: {transcript}")
    try:
        # Create Gemini client with the appropriate API key
        client = genai.Client(api_key=api_key)
        # model = "gemini-2.0-flash-lite"
        model="gemini-2.5-flash-preview-04-17"


        # Adjust prompt based on summary type and length
        length_words = {
            "Short": "100-150 words",
            "Medium": "200-300 words",
            "Long": "400-600 words"
        }

        type_instruction = {
            "Brief": "Create a concise overview",
            "Detailed": "Create a comprehensive summary with key details",
            "Key Point": "Extract and list the main points in bullet form",
            "Chapters": "Divide the content into logical chapters with timestamps (if available) and provide a brief summary for each chapter"
        }

        prompt = f"""
        Based on the following transcript from a YouTube video, {type_instruction.get(summary_type, "create a summary")}.
        The summary should be approximately {length_words.get(summary_length, "200-300 words")} in length.
        Format the output in Markdown with appropriate headings, bullet points, and emphasis where needed.
        do not include ```markdown at the start or end of the summary.
        IMPORTANT: Always generate the summary in English, regardless of the language of the transcript.

        {"For chapter-based summaries, identify logical sections in the content and create a chapter for each major topic or segment. Format each chapter with a clear heading that includes a timestamp (if you can identify it from the transcript) and a brief title. Under each chapter heading, provide a concise summary of that section." if summary_type == "Chapters" else ""}

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
