
# FastAPI Backend Optimization for Resource-Constrained Environments

## Context and Objective
Optimize a YouTube summarizer FastAPI backend application to operate efficiently within extremely limited resources.

## Environment Specifications
- **CPU**: Limited to 0.1 CPU cores (equivalent to 10% of a single core)
- **Deployment**: the backend will be deployed on render.com with the following specifications:
  - **CPU**: 0.1 cores

## Required Optimizations


### 2. CPU Efficiency
- Optimize yt-dlp integration with specific flags:
  * `--no-check-certificate`
  * `--socket-timeout 30`
  * `--no-playlist`
  * Provide complete yt-dlp configuration code
- Implement transcript processing with:
  * Provide complete implementation code
- Implement request validation with:
  * Maximum URL length: 2048 characters
  * Maximum request payload: 10KB
  * Request timeout: 60 seconds
  * Provide complete Pydantic model and validation code

### 3. ASGI Server Configuration
- Configure Uvicorn with:
  * Workers: 2 (fixed, not dynamic)
  * Worker class: `uvicorn.workers.UvicornWorker`
  * Timeout: 120 seconds
  * Backlog: 10
  * Provide complete uvicorn configuration file
- Include Gunicorn configuration with:
  * `max_requests: 100`
  * `max_requests_jitter: 10`
  * `worker_connections: 20`
  * Provide complete gunicorn.conf.py file

### 4. Database Optimization
- Configure MongoDB with:
  * Connection pool: 5 maximum connections
  * Connection timeout: 5 seconds
  * Idle timeout: 60 seconds
  * Provide complete MongoDB connection code
- Implement query optimization:
  * Create indexes for frequently queried fields (video_id, user_id)
  * Use field projection to retrieve only necessary fields
  * Implement query timeout of 10 seconds
  * Provide complete MongoDB query examples with before/after code

### 5. Caching Implementation
- Configure Redis with:
  * Video metadata TTL: 24 hours
  * Transcripts TTL: 48 hours
  * Summaries TTL: 72 hours
  * Provide complete Redis configuration code
- Implement multi-level caching:
  * In-memory LRU cache (10MB maximum)
  * Redis cache (30MB maximum)
  * Provide complete implementation code
- Design cache keys following pattern: `{resource_type}:{id}:{version}`
- Implement cache invalidation triggered by:
  * API-based manual invalidation
  * TTL expiration
  * Memory pressure (LRU)
  * Provide complete invalidation code

### 6. Computational Optimization
- Optimize Gemini API integration:
  * Implement streaming responses
  * Implement retry logic with exponential backoff (max 3 retries)
  * Provide complete implementation code
- Optimize video processing:
  * Extract only essential metadata
  * Process maximum 10-minute segments at a time
  * Implement background processing with task queue
  * Provide complete implementation code
- Implement request batching:
  * Batch size: 5 requests maximum
  * Batch window: 2 seconds
  * Provide complete implementation code

### 7. Connection Management
- Set timeout values:
  * HTTP client timeout: 30 seconds
  * Database operations: 10 seconds
  * Redis operations: 5 seconds
  * Provide complete timeout configuration code
- Implement circuit breaker:
  * Failure threshold: 5 consecutive failures
  * Recovery time: 60 seconds
  * Half-open state retry: 1 request per 30 seconds
  * Provide complete circuit breaker implementation
- Set connection limits:
  * YouTube API: 5 concurrent connections
  * Gemini API: 3 concurrent connections
  * Provide complete connection limiting code

### 8. Request Control
- Implement rate limiting:
  * Global: 60 requests per minute
  * Per IP: 10 requests per minute
  * Per endpoint: Custom limits based on resource intensity
  * Provide complete rate limiting middleware code
- Implement request throttling:
  * For video processing: 5 concurrent requests maximum
  * For AI summarization: 5 request at a time
  * Provide complete throttling implementation

### 9. Configuration
- Provide environment-specific configuration files:
  * Development (dev.env)
  * Testing (test.env)
  * Production (prod.env)
  * Include all parameters with exact values
- Implement feature flags:
  * `ENABLE_FULL_TRANSCRIPT` (default: false)
  * `ENABLE_ADVANCED_SUMMARIZATION` (default: false)
  * `ENABLE_VIDEO_PREVIEW` (default: false)
  * Provide complete feature flag implementation
- Include monitoring configuration:
  * Memory usage logging
  * CPU usage logging
  * Request latency tracking
  * Error rate monitoring
  * Provide complete monitoring setup code

### 10. Performance Testing
- Provide load testing scripts using Locust:
  * Test scenarios for different user types
  * Gradual ramp-up to simulate real traffic
  * Resource monitoring during tests
  * Provide complete Locust test files
- Define performance baselines:
  * Maximum memory usage: 480MB (93%)
  * Maximum CPU usage: 0.09 cores (90%)
  * Maximum response time: 5 seconds for non-processing endpoints
  * Maximum throughput: 30 requests per minute
  * Provide complete baseline documentation
- Include testing methodology:
  * Docker container with resource limits matching production
  * Monitoring scripts to verify resource usage
  * Provide complete testing instructions

## Deliverables
1. Complete code changes with before/after examples for each optimization area
2. Configuration files with exact parameter values for all components
3. Step-by-step implementation guide with code snippets
4. Locust test scripts to verify optimizations under load
5. Monitoring setup code for tracking resource usage in production
6. Documentation explaining the rationale behind each optimization

## Requirements:

1. **Preserve These Specific Functions functionality:**
   - `extract_video_info` function
   - `generate_qa_response` function
   - `generate_summary` function

2. **Do Not Modify:**
   - API endpoints and their functionality
   - Environment variable loading mechanisms
   - Database access patterns
   - Redis cache access methods
   - Logging implementation
   - Error handling approaches
   - Configuration loading
   - Dependency management
   - Server startup procedures
   - API documentation generation
   - Test execution methods
   - Code formatting and linting rules
   - Deployment processes
3. **Focus Areas:**
    - memory management
    - cpu efficiency
    - asgi server configuration
    - database optimization
    - caching implementation
    - computational optimization
    - connection management
    - request control
    - configuration
    - performance testing
4. don't change the google-genai code
use context7 to use the google-genai code
use context7 to use yt-dlp code
use context7 to use the redis code
use context7 to use the mongodb code

Please analyze the current FastAPI implementation and provide these specific optimizations with working code examples that can be directly implemented in the application. Add the files in the project structure where they belong in backend\app folder. use sequential thinking.
