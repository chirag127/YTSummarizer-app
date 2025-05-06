"""
Tests for the token management utilities.
"""

import pytest
from unittest.mock import patch, MagicMock

import token_management

def test_count_tokens():
    """Test the count_tokens function."""
    # Test with tiktoken available
    with patch("token_management.tiktoken") as mock_tiktoken:
        mock_encoding = MagicMock()
        mock_encoding.encode.return_value = [1, 2, 3, 4, 5]  # 5 tokens
        mock_tiktoken.encoding_for_model.return_value = mock_encoding
        
        result = token_management.count_tokens("This is a test.")
        assert result == 5
        mock_tiktoken.encoding_for_model.assert_called_once_with("gpt-4")
    
    # Test with tiktoken not available
    with patch("token_management.tiktoken", None):
        with patch("token_management.count_tokens_fallback") as mock_fallback:
            mock_fallback.return_value = 4  # Fallback count
            
            result = token_management.count_tokens("This is a test.")
            assert result == 4
            mock_fallback.assert_called_once_with("This is a test.")

def test_count_tokens_fallback():
    """Test the count_tokens_fallback function."""
    # Test with a simple string
    result = token_management.count_tokens_fallback("This is a test.")
    assert result == 3  # ~4 chars per token, so 15/4 = 3.75, rounded down to 3
    
    # Test with a longer string
    result = token_management.count_tokens_fallback("This is a longer test string with more tokens.")
    assert result == 12  # 49/4 = 12.25, rounded down to 12

def test_truncate_transcript():
    """Test the truncate_transcript function."""
    # Test with a short transcript (no truncation needed)
    with patch("token_management.count_tokens") as mock_count_tokens:
        mock_count_tokens.return_value = 500  # Below the limit
        
        result = token_management.truncate_transcript("This is a test transcript.", 1000)
        assert result == "This is a test transcript."
    
    # Test with a long transcript (truncation needed)
    with patch("token_management.count_tokens") as mock_count_tokens:
        mock_count_tokens.side_effect = [1500, 900]  # First call returns 1500, second call after truncation returns 900
        
        result = token_management.truncate_transcript("This is a test transcript.", 1000)
        assert "This is a test transcript." in result
        assert "Note: The transcript has been truncated" in result

def test_prepare_for_model():
    """Test the prepare_for_model function."""
    # Test with a short transcript and no history
    with patch("token_management.count_tokens") as mock_count_tokens, \
         patch("token_management.truncate_transcript") as mock_truncate_transcript:
        
        mock_count_tokens.return_value = 500  # Below the limit
        mock_truncate_transcript.return_value = "This is a test transcript."
        
        transcript, history = token_management.prepare_for_model(
            "This is a test transcript.",
            "What is the video about?",
            []
        )
        
        assert transcript == "This is a test transcript."
        assert history == []
    
    # Test with a long transcript and history
    with patch("token_management.count_tokens") as mock_count_tokens, \
         patch("token_management.truncate_transcript") as mock_truncate_transcript, \
         patch("token_management.manage_history_tokens") as mock_manage_history_tokens:
        
        mock_count_tokens.return_value = 1500  # Above the limit
        mock_truncate_transcript.return_value = "This is a truncated transcript."
        mock_manage_history_tokens.return_value = (
            [{"role": "user", "content": "Previous question"}],
            "What is the video about?"
        )
        
        transcript, history = token_management.prepare_for_model(
            "This is a test transcript.",
            "What is the video about?",
            [{"role": "user", "content": "Previous question"}]
        )
        
        assert transcript == "This is a truncated transcript."
        assert history == [{"role": "user", "content": "Previous question"}]
        mock_truncate_transcript.assert_called_once()
        mock_manage_history_tokens.assert_called_once()
