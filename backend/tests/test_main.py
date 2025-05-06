"""
Tests for the main FastAPI application.
"""

def test_root_endpoint(test_client):
    """Test the root endpoint returns the expected response."""
    response = test_client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "YouTube Summarizer API is running"}
