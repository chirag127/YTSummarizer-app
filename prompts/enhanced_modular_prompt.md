# YouTube Summarizer Backend Refactoring Instructions

## Objective
Refactor the YouTube Summarizer backend code to improve modularity and maintainability while preserving all existing functionality.

## What to Preserve (Do Not Modify)
1. Core Functions:
   - `extract_video_info` function - keep implementation exactly as is
   - `generate_qa_response` function - keep implementation exactly as is
   - `generate_summary` function - keep implementation exactly as is

2. API & Infrastructure:
   - All API endpoints and their functionality
   - Environment variable loading mechanism
   - Database access methods and patterns
   - Redis cache implementation
   - Logging implementation
   - Error handling patterns
   - Configuration management
   - Dependency specifications
   - Server startup procedures
   - API documentation generation
   - Test execution methods
   - Deployment processes

## What to Change
1. Code Organization:
   - Reorganize code into a more modular structure
   - Create appropriate folders for different components (e.g., routes, services, models, utils)
   - Move functions to their logical locations without changing their implementation
   - Improve file organization to enhance maintainability

2. Focus Areas:
   - Code organization and structure
   - Reducing code duplication through proper modularization
   - Improving readability through better file organization
   - Maintaining consistent import/export patterns

## Important Constraints
- Do not modify any function implementations - only relocate them
- Do not change code formatting, linting rules, or coding style
- Preserve all existing functionality exactly as is
- Focus exclusively on code organization, readability, and reducing duplication
- make the new code run using the run.py file
