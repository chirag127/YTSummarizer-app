"""
Test script for token management module.

This script tests the token management functionality to ensure it correctly
handles token limits for transcripts and conversation history.
"""

import asyncio
import logging
import token_management

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_token_management():
    """Test token management functionality."""
    
    # Test transcript truncation
    logger.info("Testing transcript truncation...")
    
    # Create a long transcript (approximately 25,000 tokens)
    long_transcript = "This is a test sentence. " * 6000
    
    # Count tokens in the original transcript
    original_tokens = token_management.count_tokens(long_transcript)
    logger.info(f"Original transcript: {original_tokens} tokens")
    
    # Truncate the transcript
    truncated_transcript = token_management.truncate_transcript(long_transcript)
    
    # Count tokens in the truncated transcript
    truncated_tokens = token_management.count_tokens(truncated_transcript)
    logger.info(f"Truncated transcript: {truncated_tokens} tokens")
    logger.info(f"Truncation removed {original_tokens - truncated_tokens} tokens")
    
    # Verify truncation respects the limit
    assert truncated_tokens <= token_management.MAX_TRANSCRIPT_TOKENS, "Truncation failed to respect token limit"
    
    # Test history management
    logger.info("\nTesting conversation history management...")
    
    # Create a conversation history with multiple messages
    history = [
        {"role": "user", "content": "What is this video about?"},
        {"role": "model", "content": "This video discusses artificial intelligence and its applications in modern society."},
        {"role": "user", "content": "Can you tell me more about the AI applications mentioned?"},
        {"role": "model", "content": "The video mentions several AI applications including natural language processing, computer vision, and reinforcement learning. It explains how these technologies are being used in various industries such as healthcare, finance, and transportation."},
        {"role": "user", "content": "What did they say about AI in healthcare?"},
        {"role": "model", "content": "The video explains that AI is transforming healthcare through applications like medical image analysis, drug discovery, and personalized treatment plans. It discusses how machine learning algorithms can analyze medical images to detect diseases earlier and more accurately than human doctors in some cases. It also mentions how AI is accelerating the drug discovery process by predicting which compounds might be effective against certain diseases."},
    ]
    
    # Count tokens in the original history
    original_history_tokens = sum(token_management.count_tokens(msg["content"]) for msg in history)
    logger.info(f"Original history: {len(history)} messages, {original_history_tokens} tokens")
    
    # Current question
    question = "Did they mention any specific examples of AI in medical imaging?"
    question_tokens = token_management.count_tokens(question)
    logger.info(f"Question: {question_tokens} tokens")
    
    # Manage history
    managed_history, remaining_tokens = token_management.manage_history_tokens(history, question)
    
    # Count tokens in the managed history
    managed_history_tokens = sum(token_management.count_tokens(msg["content"]) for msg in managed_history)
    logger.info(f"Managed history: {len(managed_history)} messages, {managed_history_tokens} tokens")
    logger.info(f"Remaining tokens: {remaining_tokens}")
    
    # Verify history management respects the limit
    assert managed_history_tokens + question_tokens <= token_management.MAX_HISTORY_TOKENS, "History management failed to respect token limit"
    
    # Test the full prepare_for_model function
    logger.info("\nTesting prepare_for_model function...")
    
    # Prepare transcript and history for the model
    managed_transcript, managed_history = token_management.prepare_for_model(long_transcript, question, history)
    
    # Count tokens
    final_transcript_tokens = token_management.count_tokens(managed_transcript)
    final_history_tokens = sum(token_management.count_tokens(msg["content"]) for msg in managed_history)
    
    logger.info(f"Final transcript: {final_transcript_tokens} tokens")
    logger.info(f"Final history: {len(managed_history)} messages, {final_history_tokens} tokens")
    logger.info(f"Total tokens used: {final_transcript_tokens + final_history_tokens + question_tokens}")
    
    # Verify total tokens are within limits
    total_tokens = final_transcript_tokens + final_history_tokens + question_tokens
    assert total_tokens <= token_management.MAX_TOTAL_TOKENS - token_management.RESERVE_TOKENS, "Total tokens exceed limit"
    
    logger.info("All token management tests passed!")

if __name__ == "__main__":
    asyncio.run(test_token_management())
