"""
Simple script to measure FastAPI application startup time.
"""

import time
import asyncio
import sys

async def measure_startup():
    """Measure the startup time of the FastAPI application."""
    start_time = time.time()
    
    # Import the app
    from app.main import app
    
    end_time = time.time()
    elapsed = end_time - start_time
    
    print(f"Application startup completed in {elapsed:.4f} seconds")
    return elapsed

if __name__ == "__main__":
    elapsed = asyncio.run(measure_startup())
    sys.exit(0)
