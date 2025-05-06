"""
Entry point for the YouTube Summarizer backend.

This module starts the FastAPI application using uvicorn.
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
