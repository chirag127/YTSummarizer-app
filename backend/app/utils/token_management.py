"""
Token management module for handling conversation history token limits.

This module provides functions to:
1. Count tokens in text
2. Manage conversation history to stay within token limits
3. Truncate or summarize older messages when approaching token limits
"""

import re
import logging
from typing import List, Dict, Any, Tuple
import tiktoken

# Configure logging
logger = logging.getLogger(__name__)

# Token limits for Gemini 2.5 Flash Preview (04-17)
# Based on the official documentation:
# - Input token limit: 1,048,576 tokens
# - Output token limit: 65,536 tokens
MAX_TOTAL_TOKENS = 1048576  # Maximum tokens for the entire input context
MAX_TRANSCRIPT_TOKENS = 800000  # Maximum tokens for the transcript
MAX_HISTORY_TOKENS = 150000  # Maximum tokens for conversation history
MAX_QUESTION_TOKENS = 2000  # Maximum tokens for the current question
RESERVE_TOKENS = 65536  # Reserve tokens for the model's response (matches output limit)

# Fallback token counting for when tiktoken is not available
def count_tokens_fallback(text: str) -> int:
    """
    Estimate token count using a simple heuristic.
    This is a fallback method when tiktoken is not available.

    Args:
        text: The text to count tokens for

    Returns:
        Estimated token count
    """
    # Simple heuristic: ~4 characters per token on average
    return len(text) // 4

# Try to use tiktoken for more accurate token counting
try:
    # Initialize the tokenizer
    # Using cl100k_base which is close to what Gemini models use
    tokenizer = tiktoken.get_encoding("cl100k_base")

    def count_tokens(text: str) -> int:
        """
        Count tokens in text using tiktoken.

        Args:
            text: The text to count tokens for

        Returns:
            Token count
        """
        if not text:
            return 0
        return len(tokenizer.encode(text))

except ImportError:
    logger.warning("tiktoken not installed. Using fallback token counting method.")
    count_tokens = count_tokens_fallback

def truncate_transcript(transcript: str, max_tokens: int = MAX_TRANSCRIPT_TOKENS) -> str:
    """
    Truncate transcript to fit within token limit.

    Args:
        transcript: The full transcript text
        max_tokens: Maximum allowed tokens

    Returns:
        Truncated transcript
    """
    if not transcript:
        return ""

    # Count tokens in the transcript
    token_count = count_tokens(transcript)

    # If within limits, return as is
    if token_count <= max_tokens:
        return transcript

    # Otherwise, truncate
    logger.info(f"Truncating transcript from {token_count} tokens to {max_tokens} tokens")

    # Simple truncation approach - split into sentences and keep adding until limit
    sentences = re.split(r'(?<=[.!?])\s+', transcript)
    truncated = []
    current_tokens = 0

    for sentence in sentences:
        sentence_tokens = count_tokens(sentence)
        if current_tokens + sentence_tokens <= max_tokens:
            truncated.append(sentence)
            current_tokens += sentence_tokens
        else:
            break

    result = " ".join(truncated)
    logger.info(f"Truncated transcript to {count_tokens(result)} tokens")
    return result

def manage_history_tokens(
    history: List[Dict[str, Any]],
    current_question: str,
    max_history_tokens: int = MAX_HISTORY_TOKENS
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Manage conversation history to stay within token limits.

    Args:
        history: List of conversation messages
        current_question: The current user question
        max_history_tokens: Maximum allowed tokens for history

    Returns:
        Tuple of (managed history, remaining tokens)
    """
    if not history:
        return [], max_history_tokens

    # Count tokens in the current question
    question_tokens = count_tokens(current_question)
    question_tokens = min(question_tokens, MAX_QUESTION_TOKENS)

    # Calculate available tokens for history
    available_tokens = max_history_tokens - question_tokens

    # If we have enough tokens for all history, return as is
    total_history_tokens = sum(count_tokens(msg["content"]) for msg in history)
    if total_history_tokens <= available_tokens:
        return history, available_tokens - total_history_tokens

    # We need to reduce history
    logger.info(f"Reducing history from {total_history_tokens} tokens to fit within {available_tokens} tokens")

    # Strategy: Keep most recent messages, drop oldest ones
    managed_history = []
    used_tokens = 0

    # Process messages in reverse order (newest first)
    for msg in reversed(history):
        msg_tokens = count_tokens(msg["content"])

        if used_tokens + msg_tokens <= available_tokens:
            managed_history.insert(0, msg)  # Insert at beginning to maintain order
            used_tokens += msg_tokens
        else:
            # We can't fit this message, so stop
            break

    # If we couldn't keep any messages, add a summary message
    if not managed_history and history:
        summary_msg = {
            "role": "system",
            "content": "Previous conversation history was too long and has been summarized. This is a new conversation about the same video."
        }
        summary_tokens = count_tokens(summary_msg["content"])
        managed_history = [summary_msg]
        used_tokens = summary_tokens

    remaining_tokens = available_tokens - used_tokens
    logger.info(f"Managed history to {used_tokens} tokens, {remaining_tokens} tokens remaining")
    return managed_history, remaining_tokens

def prepare_for_model(
    transcript: str,
    question: str,
    history: List[Dict[str, Any]]
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Prepare transcript and history for the model, ensuring token limits are respected.

    Args:
        transcript: The video transcript
        question: The current user question
        history: Previous conversation history

    Returns:
        Tuple of (managed transcript, managed history)
    """
    # First, manage the history
    managed_history, _ = manage_history_tokens(history, question)

    # Then, truncate the transcript to fit within limits
    # We use a fixed transcript limit to ensure consistency
    transcript_limit = MAX_TRANSCRIPT_TOKENS
    managed_transcript = truncate_transcript(transcript, transcript_limit)

    # Log the total tokens being sent to the model
    total_input_tokens = (
        count_tokens(managed_transcript) +
        sum(count_tokens(msg["content"]) for msg in managed_history) +
        count_tokens(question)
    )
    logger.info(f"Total input tokens: {total_input_tokens}/{MAX_TOTAL_TOKENS} " +
                f"({(total_input_tokens/MAX_TOTAL_TOKENS)*100:.2f}% of limit)")

    return managed_transcript, managed_history
