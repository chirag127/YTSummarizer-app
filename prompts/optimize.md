Optimize the FastAPI backend application for resource-constrained environments with approximately 0.1 CPU cores and . Specifically:

1. Implement memory optimization techniques to keep the application within the limit
2. Reduce CPU usage through efficient request handling and processing
3. Configure appropriate worker settings for the ASGI server (Uvicorn/Gunicorn)
4. Implement proper connection pooling for any database interactions
5. Add caching mechanisms where appropriate to reduce computational load
6. Optimize any heavy computational operations or data processing
7. Configure proper timeouts and connection limits
8. Implement request throttling or rate limiting if necessary
9. Provide specific configuration settings that should be applied
10. Include performance testing methodology to verify the optimizations work within the specified resource constraints

Please analyze the current FastAPI implementation and provide specific code changes with explanations for each optimization.
Based on my analysis of the codebase, I create a comprehensive optimization plan to make the FastAPI backend run efficiently on resource-constrained environments with approximately 0.1 CPU cores and .

1. Memory Optimization Techniques
   Implement Memory Monitoring and Limits
   Create a memory monitoring utility
   Set explicit memory limits for different components
   Implement graceful degradation when memory limits are reached
   Optimize Redis Cache Configuration
   Configure Redis with appropriate memory limits
   Implement more aggressive LRU eviction policies
   Add memory usage monitoring and circuit breakers
   Optimize MongoDB Connection Pooling
   Configure appropriate connection pool size
   Implement connection timeouts and retry logic
   Add circuit breaker pattern for database operations
   Optimize Request and Response Handling
   Implement streaming responses for large data
   Add pagination with smaller page sizes
   Optimize JSON serialization/deserialization
2. CPU Usage Optimization
   Optimize yt-dlp Usage
   Implement more efficient video info extraction
   Add timeouts and circuit breakers for external calls
   Implement request batching and throttling
   Optimize Transcript Processing
   Implement more efficient transcript extraction and cleaning
   Add chunking for large transcripts
   Optimize regex operations
   Optimize Token Management
   Improve token counting efficiency
   Implement more efficient truncation algorithms
   Add caching for token counts
   Optimize API Endpoints
   Add request validation with size limits
   Implement background tasks for non-critical operations
   Add circuit breakers for expensive operations
3. ASGI Server Configuration
   Configure Uvicorn/Gunicorn for Low-Resource Environments
   Set appropriate worker count and worker class
   Configure timeouts and backlog
   Implement graceful shutdown
   Implement Process and Thread Management
   Set appropriate process and thread limits
   Configure worker lifecycle management
   Implement resource monitoring and auto-scaling
4. Database Connection Pooling
   Optimize MongoDB Connection Pool
   Configure appropriate pool size and timeout
   Implement connection validation and cleanup
   Add circuit breaker pattern
   Implement Query Optimization
   Add index usage monitoring
   Optimize query patterns
   Implement projection to limit returned fields
5. Caching Mechanisms
   Enhance Redis Cache Configuration
   Configure appropriate TTL for different cache types
   Implement multi-level caching strategy
   Add cache warming for frequently accessed data
   Optimize Cache Key Design
   Implement more efficient key structure
   Add cache versioning
   Implement cache invalidation strategy
6. Computational Optimization
   Optimize Gemini API Integration
   Implement more efficient prompt construction
   Add streaming responses
   Optimize token management
   Optimize Video Processing
   Implement more efficient video info extraction
   Add timeouts and circuit breakers
   Implement request batching
7. Timeouts and Connection Limits
   Implement Comprehensive Timeout Strategy
   Add timeouts for all external calls
   Implement circuit breakers
   Add graceful degradation
   Configure Connection Limits
   Set appropriate connection limits for external services
   Implement connection pooling
   Add connection validation and cleanup
8. Request Throttling and Rate Limiting
   Implement Rate Limiting
   Add rate limiting middleware
   Configure appropriate rate limits
   Implement client-specific rate limits
   Add Request Throttling
   Implement request throttling for expensive operations
   Add queue management
   Implement priority-based processing
9. Configuration Settings
   Create Environment-Specific Configuration
   Add configuration for low-resource environments
   Implement feature flags
   Add dynamic configuration
   Implement Monitoring and Alerting
   Add resource usage monitoring
   Implement alerting for resource constraints
   Add performance metrics collection
10. Performance Testing Methodology
    Implement Load Testing
    Create load testing scripts
    Define performance baselines
    Implement continuous performance testing
    Add Resource Monitoring
    Implement memory and CPU monitoring
    Add performance metrics collection
    Create performance dashboards
