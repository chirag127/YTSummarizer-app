Okay, here is a Product Requirements Document (PRD) focused specifically on optimizing the performance of the YTSummarizer application, respecting all your constraints, particularly the limited backend CPU and the restrictions on modifying comments or Gemini code.

---

**Product Requirements Document: YTSummarizer Performance Optimization**

**1. Introduction**

This document outlines the requirements for improving the performance and responsiveness of the YTSummarizer application. The primary goal is to enhance the user experience by reducing perceived latency and optimizing resource utilization, especially considering the stringent backend constraint of **0.1 CPU core**. This optimization effort will focus on refining existing functionalities and infrastructure without removing core features, existing code comments, or modifying the core interaction logic with the Google Gemini AI model.
IMPORTANT CONSTRAINTS:
No Removal of Comments: Existing code comments must be preserved.
No Modification of Gemini Interaction Code: The core logic interacting with the Google Gemini API (specifically the API call structure and prompt generation logic itself, beyond data preparation) must remain untouched due to potential complexities and unintended consequences ("hallucinations"). Optimization efforts should focus around this interaction (e.g., caching results, asynchronous handling).
no removal of the proxy code in yt-dlp as it is important for the app to work properly and don't remove any existing code or modify the core functionality of the app, just optimize the existing code and implement the new features as described.
**2. Goals**

*   **Improve Perceived Frontend Responsiveness:** Ensure the React Native app remains fluid and interactive, especially during background operations like fetching data or generating summaries.
*   **Optimize Backend Resource Usage:** Implement strategies to handle requests efficiently within the 0.1 CPU limit, minimizing processing time per request and preventing resource exhaustion.
*   **Reduce Latency for Summary Availability:** Decrease the time users wait for summaries to be displayed after initiating a request, primarily through asynchronous processing and efficient caching.
*   **Enhance Caching Effectiveness:** Maximize the use of Redis on the backend and implement robust client-side caching to reduce redundant processing and network requests.
*   **Maintain Application Stability:** Ensure optimizations do not introduce new bugs or regressions, maintaining the reliability of all existing features.

**3. Non-Goals**

*   **Removing Existing Features:** All current features (Video Input, Summary Generation types/lengths, Summary Features, History Management) will be retained.
*   **Modifying Core Gemini AI Interaction:** The code responsible for sending requests to and receiving responses from the Google Gemini API will **not** be altered. The focus is on *how* and *when* this interaction is initiated and handled, not the interaction itself.
*   **Removing Existing Code Comments:** All source code comments currently present will be preserved.
*   **Changing Core Business Logic:** The fundamental workflow of fetching transcripts, generating summaries, and storing them will remain the same, but the *implementation* will be optimized.
*   **Major Architectural Overhaul:** We will work within the existing React Native Expo / Python FastAPI / MongoDB / Redis stack.

**4. Current State & Known Bottlenecks**

*   **Backend (FastAPI):**
    *   Synchronous operations (potentially `yt-dlp` execution, network calls) may block the server thread, severely impacting performance under the 0.1 CPU constraint.
    *   Directly handling potentially long-running tasks (transcript download/processing, AI summarization API calls) within API request handlers leads to long response times and potential timeouts.
    *   Redis caching might not be utilized optimally for intermediate steps or frequent requests.
*   **Frontend (React Native Expo):**
    *   UI might freeze or become unresponsive while waiting for backend responses.
    *   Rendering large summaries or long lists in history could impact performance.
    *   Inefficient state management could lead to unnecessary re-renders.
    *   Handling of loading states and errors during long operations could be improved.
*   **Database (MongoDB):**
    *   Potentially unoptimized queries for history fetching or filtering.
    *   Lack of appropriate indexes could slow down database operations.
*   **General:**
    *   Network latency between client, server, YouTube, and Gemini contributes to overall wait times.

**5. Proposed Optimizations & Requirements**

**5.1. Backend Optimizations (FastAPI)**

*   **REQ-BE-01: Implement Asynchronous Background Tasks for Summarization:**
    *   **Description:** Refactor the summary generation endpoint (`/summarize` or similar). Instead of processing the request synchronously, the endpoint should immediately validate the URL, acknowledge the request (e.g., return a `202 Accepted` status with a task ID), and enqueue a background job to handle the actual transcript fetching (`yt-dlp`), Gemini AI call, and database saving.
    *   **Implementation:** Utilize FastAPI's built-in `BackgroundTasks` or preferably a more robust task queue library compatible with async FastAPI (like `ARQ` or `Celery` with an async broker like Redis) to manage these jobs. This frees up the API worker immediately.
    *   **Constraint Adherence:** Does not modify Gemini interaction code, only *when* it's called (in a background task). Preserves comments. Does not remove features. Essential for 0.1 CPU limit.
*   **REQ-BE-02: Optimize `yt-dlp` Invocation:**
    *   **Description:** Ensure `yt-dlp` is invoked asynchronously within the background task. Explicitly request *only* the necessary metadata and transcript/subtitle data, avoiding downloading video/audio streams. Configure `yt-dlp` options for performance where possible (e.g., prefer specific subtitle formats if faster).
    *   **Constraint Adherence:** Modifies *how* `yt-dlp` is called, not core app logic or Gemini calls. Preserves comments.
*   **REQ-BE-03: Enhance Redis Caching:**
    *   **Description:**
        *   Cache fetched transcripts associated with a video ID for a defined TTL to avoid refetching if multiple summary types/lengths are requested close together.
        *   Ensure successful summaries are aggressively cached in Redis using a key incorporating video ID, summary type, and length. Check Redis *before* initiating any background task for a known video/summary combination.
        *   Cache video metadata (title, thumbnail URL) fetched by `yt-dlp` separately to speed up initial display on the frontend.
    *   **Constraint Adherence:** Works within existing Redis infrastructure. Preserves comments. Does not modify Gemini logic.
*   **REQ-BE-04: Implement Status Endpoint for Background Tasks:**
    *   **Description:** Create a new API endpoint (e.g., `/tasks/{task_id}/status`) that the frontend can poll to check the status (Pending, Processing, Complete, Failed) of a summary generation task initiated via REQ-BE-01. If complete, this endpoint should return the generated summary data (or an identifier to fetch it).
    *   **Constraint Adherence:** New functionality to support async flow. Preserves comments. Does not modify Gemini logic.
*   **REQ-BE-05: Ensure All I/O is Asynchronous:**
    *   **Description:** Review all backend code (API handlers, background tasks) to ensure any I/O operation (database calls via `motor` or similar async driver, external HTTP requests, file operations if any) uses `async`/`await` correctly to prevent blocking the event loop.
    *   **Constraint Adherence:** Performance tuning of existing code structure. Preserves comments. Does not modify Gemini logic.

**5.2. Frontend Optimizations (React Native Expo)**

*   **REQ-FE-01: Handle Asynchronous Summary Generation:**
    *   **Description:** Modify the frontend logic for requesting summaries. When a user requests a summary:
        1.  Call the updated backend endpoint (REQ-BE-01).
        2.  Receive the task ID.
        3.  Display an "In Progress" or loading state for that specific summary request (e.g., within the history item or a dedicated section).
        4.  Periodically poll the status endpoint (REQ-BE-04) using the task ID. Use a reasonable polling interval (e.g., starting at 2s, increasing exponentially up to 10s) to balance responsiveness and backend load.
        5.  Once the status is "Complete", fetch the summary data and update the UI.
        6.  Handle "Failed" status appropriately with user feedback.
    *   **Constraint Adherence:** Adapts frontend to backend changes. Preserves comments. Does not modify Gemini logic.
*   **REQ-FE-02: Optimize List Rendering:**
    *   **Description:** Ensure the History screen uses `FlatList` or `SectionList` for efficient rendering of potentially long lists of summaries. Implement `keyExtractor` correctly. Memoize list item components (`React.memo`) to prevent unnecessary re-renders if props haven't changed.
    *   **Constraint Adherence:** Standard React Native performance optimization. Preserves comments.
*   **REQ-FE-03: Improve Client-Side Caching:**
    *   **Description:** Enhance local caching (e.g., using AsyncStorage, SQLite via Expo modules, or a state management library's persistence). Cache fetched summaries and metadata locally. Before initiating a new summary request, check the local cache first. Sync local cache with backend data periodically or on app load. Ensure offline mode reliably uses cached data.
    *   **Constraint Adherence:** Enhances existing offline/caching functionality. Preserves comments.
*   **REQ-FE-04: Optimize State Management:**
    *   **Description:** Review state management logic. Ensure state updates are minimal and targeted. If using context, ensure consumers are specific. If using libraries like Redux/Zustand, use selectors effectively to prevent components from re-rendering due to unrelated state changes.
    *   **Constraint Adherence:** Performance tuning. Preserves comments.
*   **REQ-FE-05: Optimize Markdown Rendering:**
    *   **Description:** If rendering very long summaries causes performance issues, investigate optimizing the Markdown component. This could involve using a more performant library or potentially virtualizing the rendering of large Markdown blocks if feasible.
    *   **Constraint Adherence:** Performance tuning. Preserves comments.
*   **REQ-FE-06: Background TTS Playback Refinement:**
    *   **Description:** Ensure the Text-to-Speech feature operates smoothly, especially during background playback. Verify resource usage and ensure it doesn't negatively impact overall app responsiveness. Use platform APIs correctly for background audio.
    *   **Constraint Adherence:** Enhances existing feature performance. Preserves comments.

**5.3. Database Optimizations (MongoDB)**

*   **REQ-DB-01: Indexing:**
    *   **Description:** Review MongoDB queries used for fetching history, filtering by starred status, and looking up summaries by video ID. Ensure appropriate indexes exist on the relevant fields (e.g., `video_id`, `user_id` [if applicable], `starred`, `createdAt`, `summary_type`, `summary_length`). Use MongoDB's `explain()` functionality to verify index usage.
    *   **Constraint Adherence:** Standard database optimization. Preserves comments.

**6. Technical Constraints**

*   Backend compute resources are strictly limited to 0.1 CPU.
*   No modifications allowed to the core Google Gemini API interaction code.
*   All existing source code comments must be preserved.
*   Existing application features must remain functional.
*   The current technology stack (React Native Expo, Python FastAPI, MongoDB, Redis) must be used.

**7. Metrics & Measurement**

*   **Backend:**
    *   Average API response time for the initial summary request endpoint (REQ-BE-01). Target: < 200ms.
    *   Average API response time for the status check endpoint (REQ-BE-04). Target: < 150ms.
    *   Backend CPU utilization under simulated load. Target: Remain consistently below threshold, avoiding spikes that cause throttling or crashes.
    *   Task queue length and average task completion time.
    *   Redis cache hit rate.
*   **Frontend:**
    *   UI frame rate (FPS) during normal usage and while summaries are pending. Target: Maintain close to 60 FPS.
    *   Perceived time from tapping "Summarize" to seeing an "In Progress" state. Target: Near instantaneous (< 500ms).
    *   Perceived time from tapping "Summarize" to seeing the final summary (dependent on video length/complexity, but should improve on average due to parallelism).
    *   App startup time.
*   **Overall:**
    *   Reduced error rates related to timeouts or resource exhaustion.
    *   User feedback regarding app responsiveness.


IMPORTANT CONSTRAINTS:
No Removal of Comments: Existing code comments must be preserved.
No Modification of Gemini Interaction Code: The core logic interacting with the Google Gemini API (specifically the API call structure and prompt generation logic itself, beyond data preparation) must remain untouched due to potential complexities and unintended consequences ("hallucinations"). Optimization efforts should focus around this interaction (e.g., caching results, asynchronous handling).
