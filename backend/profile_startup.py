"""
Profiling script for measuring FastAPI application startup time.

This script measures the time taken by different components during the startup process.
"""

import time
import importlib
import asyncio
from contextlib import asynccontextmanager

# Dictionary to store timing results
timing_results = {}

def measure_time(name):
    """Decorator to measure execution time of a function."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            result = await func(*args, **kwargs)
            end_time = time.time()
            timing_results[name] = end_time - start_time
            print(f"{name} completed in {end_time - start_time:.4f} seconds")
            return result
        return wrapper
    return decorator

@measure_time("Import FastAPI")
async def import_fastapi():
    """Measure time to import FastAPI."""
    importlib.import_module('fastapi')

@measure_time("Import app.config")
async def import_config():
    """Measure time to import config module."""
    importlib.import_module('app.config')

@measure_time("Import app.core.cache")
async def import_cache():
    """Measure time to import cache module."""
    importlib.import_module('app.core.cache')

@measure_time("Import app.core.token_management")
async def import_token_management():
    """Measure time to import token management module."""
    importlib.import_module('app.core.token_management')

@measure_time("Import app.services.database")
async def import_database():
    """Measure time to import database module."""
    importlib.import_module('app.services.database')

@measure_time("Import app.api.routes")
async def import_routes():
    """Measure time to import routes module."""
    importlib.import_module('app.api.routes')

@measure_time("Initialize MongoDB")
async def init_mongodb():
    """Measure time to initialize MongoDB connection."""
    from app.services.database import init_db
    await init_db()

@measure_time("Initialize Redis")
async def init_redis():
    """Measure time to initialize Redis connection."""
    from app.core.cache import init_redis
    await init_redis()

@measure_time("Create FastAPI app")
async def create_app():
    """Measure time to create FastAPI app instance."""
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from app.api.routes import router
    
    # Create app without lifespan to avoid triggering DB connections
    app = FastAPI(title="YouTube Summarizer API")
    
    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include all routes
    app.include_router(router)
    
    return app

async def run_profiling():
    """Run all profiling measurements."""
    total_start = time.time()
    
    # Measure import times
    await import_fastapi()
    await import_config()
    await import_cache()
    await import_token_management()
    await import_database()
    await import_routes()
    
    # Measure initialization times
    await init_mongodb()
    await init_redis()
    await create_app()
    
    # Calculate total time
    total_time = time.time() - total_start
    timing_results["Total"] = total_time
    
    # Print summary
    print("\nStartup Profiling Summary:")
    print("=" * 50)
    for name, duration in sorted(timing_results.items(), key=lambda x: x[1], reverse=True):
        if name != "Total":
            percentage = (duration / total_time) * 100
            print(f"{name}: {duration:.4f} seconds ({percentage:.2f}%)")
    print("-" * 50)
    print(f"Total startup time: {total_time:.4f} seconds")

if __name__ == "__main__":
    asyncio.run(run_profiling())
