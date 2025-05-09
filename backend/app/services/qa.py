"""
Question-Answering service for the YouTube Summarizer API.

This module provides functions for generating answers to questions about videos.
"""

import logging
from typing import List
import google
from google.genai import types
from app.config import GEMINI_API_KEY
from app.core import token_management
from app.models.schemas import ChatMessage, ChatMessageRole

# Configure logging
logger = logging.getLogger(__name__)

async def generate_qa_response(transcript: str, question: str, history: List[ChatMessage] = None, user_api_key: str = None) -> str:
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
    api_key = user_api_key if user_api_key else GEMINI_API_KEY

    if not api_key:
        return "API key not configured. Unable to generate answer."

    try:
        # Convert history to the format expected by token_management
        history_for_token_mgmt = []
        if history:
            for msg in history:
                history_for_token_mgmt.append({
                    "role": "user" if msg.role == ChatMessageRole.USER else "model",
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
        client = google.genai.Client(api_key=api_key)

        # Try to use gemini-2.5-flash-preview-04-17 first, but fall back to gemini-2.0-flash-lite if unavailable
        primary_model = "gemini-2.5-flash-preview-04-17"

        # fallback_model = "gemini-2.0-flash-lite"
        fallback_model = "gemini-2.0-flash"

        # Start with the primary model
        model = primary_model

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

        # Try with primary model first
        try:
            logger.info(f"Attempting to generate QA response with model: {model}")
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=generate_content_config
            )

            # Log the response for debugging
            logger.info(f"Gemini API response: {response}")

            # Extract text from response
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

                    logger.info("Successfully generated QA response with fallback model")

                    # Extract text from response
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

                except Exception as fallback_error:
                    logger.error(f"Error with fallback model: {fallback_error}")
                    return f"Failed to generate answer: {str(fallback_error)}"
            else:
                # For other errors, just return the original error
                return f"Failed to generate answer: {error_message}"
    except Exception as e:
        logger.error(f"Error generating answer: {e}")
        return f"Failed to generate answer: {str(e)}"
