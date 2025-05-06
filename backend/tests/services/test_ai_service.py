"""
Tests for the AI service.
"""

import pytest
from unittest.mock import patch

from app.services.ai_service import generate_summary, generate_qa_response

@pytest.mark.asyncio
async def test_generate_summary(mock_gemini):
    """Test generate_summary function."""
    # Set up mock response
    mock_gemini.models.generate_content.return_value.text = "This is a mock summary."

    # Call the function
    result = await generate_summary(
        transcript="This is a test transcript.",
        summary_type="Brief",
        summary_length="Short"
    )

    # Verify the result
    assert result == "This is a mock summary."
    mock_gemini.models.generate_content.assert_called_once()

@pytest.mark.asyncio
async def test_generate_summary_no_api_key():
    """Test generate_summary function with no API key."""
    # Patch the settings to have no API key
    with patch("app.config.settings.ai.GEMINI_API_KEY", None):
        # Call the function
        result = await generate_summary(
            transcript="This is a test transcript.",
            summary_type="Brief",
            summary_length="Short"
        )

        # Verify the result
        assert result == "API key not configured. Unable to generate summary."

@pytest.mark.asyncio
async def test_generate_summary_with_error(mock_gemini):
    """Test generate_summary function when an error occurs."""
    # Set up mock to raise an exception
    mock_gemini.models.generate_content.side_effect = Exception("Test error")

    # Call the function
    result = await generate_summary(
        transcript="This is a test transcript.",
        summary_type="Brief",
        summary_length="Short"
    )

    # Verify the result
    assert "Failed to generate summary" in result

@pytest.mark.asyncio
async def test_generate_qa_response(mock_gemini):
    """Test generate_qa_response function."""
    # Set up mock response
    mock_gemini.models.generate_content.return_value.text = "This is a mock answer."

    # Mock token management
    with patch("app.utils.token_management.prepare_for_model") as mock_prepare_for_model, \
         patch("app.utils.token_management.manage_history_tokens") as mock_manage_history_tokens, \
         patch("app.utils.token_management.count_tokens") as mock_count_tokens:

        # Configure mocks
        mock_prepare_for_model.return_value = ("Managed transcript", [])
        mock_manage_history_tokens.return_value = ([], "Managed question")
        mock_count_tokens.return_value = 100

        # Call the function
        result = await generate_qa_response(
            transcript="This is a test transcript.",
            question="What is the video about?",
            history=[]
        )

        # Verify the result
        assert result == "This is a mock answer."
        mock_gemini.models.generate_content.assert_called_once()

@pytest.mark.asyncio
async def test_generate_qa_response_no_api_key():
    """Test generate_qa_response function with no API key."""
    # Patch the settings to have no API key
    with patch("app.config.settings.ai.GEMINI_API_KEY", None):
        # Call the function
        result = await generate_qa_response(
            transcript="This is a test transcript.",
            question="What is the video about?",
            history=[]
        )

        # Verify the result
        assert result == "API key not configured. Unable to generate answer."

@pytest.mark.asyncio
async def test_generate_qa_response_with_error(mock_gemini):
    """Test generate_qa_response function when an error occurs."""
    # Set up mock to raise an exception
    mock_gemini.models.generate_content.side_effect = Exception("Test error")

    # Mock token management
    with patch("app.utils.token_management.prepare_for_model") as mock_prepare_for_model, \
         patch("app.utils.token_management.manage_history_tokens") as mock_manage_history_tokens, \
         patch("app.utils.token_management.count_tokens") as mock_count_tokens:

        # Configure mocks
        mock_prepare_for_model.return_value = ("Managed transcript", [])
        mock_manage_history_tokens.return_value = ([], "Managed question")
        mock_count_tokens.return_value = 100

        # Call the function
        result = await generate_qa_response(
            transcript="This is a test transcript.",
            question="What is the video about?",
            history=[]
        )

        # Verify the result
        assert "Failed to generate answer" in result
