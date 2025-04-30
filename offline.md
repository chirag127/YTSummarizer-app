

**Product Requirements Document: YTSummarizer - Feature Offline Capabilities**

**1. Introduction**

This document outlines the requirements for implementing comprehensive offline capabilities within the YTSummarizer application. The goal is to allow users to access previously generated summaries and queue new summary requests even without an active internet connection, significantly enhancing the app's utility and user experience, particularly in low-connectivity environments. This involves local caching of data, an offline request queueing system, and seamless handling of network status changes.

**2. Goals**

*   **Enhance Accessibility:** Allow users to access their generated summaries anytime, anywhere, regardless of internet connectivity.
*   **Improve User Experience:** Provide a seamless experience when transitioning between online and offline states. Prevent user frustration from lost requests initiated while offline.
*   **Increase App Utility:** Make the app more valuable for users who frequently experience intermittent connectivity (e.g., commuters, travelers).
*   **Optimize Performance:** Reduce redundant network requests and decrease loading times for previously accessed content through effective caching.
*   **Ensure Data Persistence:** Guarantee that summary requests made offline are not lost and are processed reliably once connectivity is restored.

**3. User Stories**

*   As a user on a flight with no Wi-Fi, I want to be able to open YTSummarizer and read the detailed summary of a lecture video I generated yesterday, so I can study during my flight.
*   As a user commuting on the subway with intermittent signal, I want to paste a YouTube link and request a "Key Points" summary, have the request queued automatically when offline, and be notified when it's successfully generated after I regain signal, so I don't lose the request or have to remember to do it again.
*   As a user with a limited data plan, I want the app to load summaries and video thumbnails I've viewed before directly from my device without re-downloading them, so I can save data and access content faster.
*   As a user, I want a clear indication within the app whether I am currently online or offline, and if any summary requests are pending in the queue.
*   As a user managing storage space, I want to be able to see how much space the app's cache is using and have an option to clear it if needed.

**4. Functional Requirements**

**4.1. Network Status Detection & Handling**

*   **FR4.1.1:** The application must continuously monitor the device's network connectivity status (Online/Offline).
*   **FR4.1.2:** The UI must provide a clear, persistent visual indicator of the current network status (e.g., a small icon, a banner).
*   **FR4.1.3:** Application behavior must adapt dynamically based on the detected network status (e.g., enabling/disabling certain actions).

**4.2. Offline Mode - Accessing Existing Summaries**

*   **FR4.2.1:** All successfully generated summaries (including text, type, length, generation time, associated video metadata like title and thumbnail URL) must be persistently stored locally on the user's device upon generation or first view.
*   **FR4.2.2:** Video thumbnails associated with summaries must be downloaded and cached locally.
*   **FR4.2.3:** Users must be able to navigate to the "History" screen while offline.
*   **FR4.2.4:** The History screen must display all locally stored summaries, including starred items, even when offline. Filtering by "Starred" must work offline using local data.
*   **FR4.2.5:** Tapping on a summary in the History list must display its full content (title, locally cached thumbnail, summary text with Markdown rendering, metadata) while offline.
*   **FR4.2.6:** The "Read Aloud" (TTS) feature must function offline for displayed summaries, using the device's native TTS engine and locally stored/cached voice data if applicable. TTS settings (speed, pitch, voice) configured previously should apply.
*   **FR4.2.7:** "Copy" and "Share" actions for summary text must function offline. Sharing will use the OS's share sheet, which might require connectivity depending on the target app.
*   **FR4.2.8:** "Starring" / "Unstarring" a summary must be possible offline. The state change must be stored locally and synced with the backend (MongoDB) when the device comes back online.
*   **FR4.2.9:** Deleting summaries must be possible offline. The deletion must be reflected locally immediately and synced with the backend when the device comes back online.
*   **FR4.2.10:** Actions requiring network connectivity (e.g., attempting to generate a *new* summary for a video *not* in the queue, checking for updated metadata not already cached) must be disabled or trigger the queueing mechanism (see 4.3) when offline.

**4.3. Queue System for Offline Requests**

*   **FR4.3.1:** When a user attempts to generate a new summary (by pasting a URL or sharing from YouTube) while the app detects it is offline:
    *   The app must inform the user that they are offline and the request will be queued.
    *   The request details (Video URL, requested Summary Type, requested Summary Length) must be persistently stored locally in an offline queue.
    *   Assign a unique ID and timestamp to each queued request.
*   **FR4.3.2:** The History screen (or a dedicated Queue section) should display pending requests from the queue, clearly indicating their status (e.g., "Pending," "Queued").
*   **FR4.3.3:** Users must be able to view the list of queued requests.
*   **FR4.3.4:** Users must be able to cancel/delete a pending request from the queue before it starts processing.
*   **FR4.3.5:** Upon detecting a transition from Offline to Online status, the application must automatically trigger the processing of the offline queue.
*   **FR4.3.6:** Queued requests must be processed sequentially in the order they were added (FIFO - First-In, First-Out).
*   **FR4.3.7:** For each queued request, the app will:
    *   Attempt to fetch video metadata (`yt-dlp`).
    *   Attempt to call the backend (FastAPI) to generate the summary (Gemini AI).
    *   Handle potential errors during processing (e.g., video unavailable, invalid URL, AI generation failure, network error during processing).
*   **FR4.3.8:** The status of the queued item should update visually during processing (e.g., "Processing...").
*   **FR4.3.9:** Upon successful generation:
    *   The summary must be saved locally and synced to the backend (MongoDB).
    *   The item must be removed from the pending queue.
    *   The new summary should appear normally in the History list.
    *   The user should receive a notification (in-app or system notification if app is backgrounded) indicating the summary is ready.
*   **FR4.3.10:** Upon failure during processing:
    *   The reason for failure should be recorded locally.
    *   The item status in the queue display should change to "Failed" with an option to view the reason.
    *   The user should be notified of the failure.
    *   The user should have the option to retry the failed request manually or delete it from the queue/failed list.
*   **FR4.3.11:** Queue processing should ideally continue in the background if the app is backgrounded after regaining connectivity, subject to OS limitations.

**4.4. Local Caching**

*   **FR4.4.1:** Implement a robust local caching mechanism for:
    *   Generated summary data (text, type, length, etc.).
    *   Video metadata (Title, Thumbnail URL, Video ID, Duration).
    *   Downloaded video thumbnail images.
*   **FR4.4.2:** When displaying a summary or video information, the app must prioritize loading from the local cache.
*   **FR4.4.3:** Network requests for metadata or summaries already present in the cache should be avoided unless explicitly refreshed or deemed stale (define staleness criteria - for this app, prioritizing offline access over absolute freshness might mean infrequent invalidation, perhaps only on manual refresh or after a long period like 30 days).
*   **FR4.4.4:** Implement a mechanism to manage cache size. This could involve:
    *   Setting a maximum cache size limit (e.g., 200MB).
    *   Using a Least Recently Used (LRU) strategy to automatically evict older cached items (especially thumbnails) when the limit is approached.
*   **FR4.4.5:** Provide a setting option for users to:
    *   View the current cache size (summaries, thumbnails).
    *   Manually clear the cache (separately for summaries/metadata vs. thumbnails, or all at once).

**5. Non-Functional Requirements**

*   **NFR5.1 Performance:** Offline summary access and history browsing must be instantaneous (< 500ms load time). Queue processing should run efficiently without significantly impacting foreground app performance or battery life.
*   **NFR5.2 Reliability:** Local storage must be robust against app crashes or unexpected closures. Queued requests must persist across app restarts. Syncing logic must handle potential conflicts gracefully (e.g., deleted locally vs. updated on server - define resolution strategy, e.g., "last write wins" or prioritize server state).
*   **NFR5.3 Storage:** The app must be mindful of local storage consumption. Cache management strategies (LRU, user clearing) are essential. Default storage limits should be reasonable.
*   **NFR5.4 Usability:** The offline status, queued items, and processing progress must be clearly communicated to the user. Transitions between online/offline states should feel seamless. Error messages (e.g., queue item failure) must be informative.
*   **NFR5.5 Data Synchronization:** Changes made offline (starring, deleting) and newly generated summaries from the queue must be reliably synced with the backend (MongoDB) upon reconnection. The app should handle sync operations efficiently, potentially batching updates.

**6. Design & UI/UX Considerations**

*   **UI6.1 Offline Indicator:** A non-intrusive but clear indicator (e.g., a cloud icon with a slash, a small banner at the top/bottom) should show when the app is offline.
*   **UI6.2 Queue Visualization:** Integrate queued items into the History screen with distinct visual cues (e.g., a "Pending" or "Queued" badge, greyed-out appearance, progress indicator during processing). Alternatively, provide a separate "Queue" tab or filter in History.
*   **UI6.3 Feedback:** Provide immediate feedback for actions taken offline (e.g., Toast message: "Request added to offline queue," "Summary starred locally, will sync later").
*   **UI6.4 Notifications:** Use in-app or system notifications (if permission granted) to inform users about the completion or failure of queued summary generations, especially if the app is in the background.
*   **UI6.5 Settings:** Add a "Storage & Cache" or "Offline Data" section in the app settings to display cache usage and provide clearing options.
*   **UI6.6 Error Display:** Failed queue items should clearly display an error icon/status, and tapping on them should provide details about the failure reason.

**7. Technical Implementation Details**

*   **7.1 Frontend (React Native Expo):**
    *   **Network Detection:** Utilize `@react-native-community/netinfo` library to subscribe to network state changes. Store the state globally (e.g., in Zustand, Redux, or Context API).
    *   **Local Storage:**
        *   For structured data (summaries, metadata, queue items): Use `AsyncStorage` for simplicity if data volume per user is expected to be moderate. For larger scale or more complex querying needs, consider `expo-sqlite` for a local relational DB or `WatermelonDB` for an observable reactive database. Structure data carefully (e.g., summaries keyed by video ID, queue items in an array).
        *   Schema Example (AsyncStorage - JSON stored under keys):
            *   `@summaries:{videoId}`: `{ videoId, url, title, thumbnailLocalUri, summaries: [{ summaryId, text, type, length, timestamp, generatedAt, ttsSettings }], starred, lastAccessed }`
            *   `@offlineQueue`: `[{ requestId, url, type, length, requestedTimestamp, status: 'pending' | 'processing' | 'failed', failureReason: null | string }]`
            *   `@syncLog`: `[{ action: 'star' | 'unstar' | 'delete', videoId: string, summaryId?: string, timestamp: number }]` (for pending backend updates)
    *   **Image Caching:** Use `expo-file-system` to download thumbnail images to the app's persistent cache directory. Store the local file URI (`thumbnailLocalUri`) in the summary data. Implement LRU eviction manually or use a library wrapper if available.
    *   **Queue Processing Logic:**
        *   On network state change to 'online', trigger a function (e.g., `processOfflineQueue`).
        *   This function iterates through items in `@offlineQueue` with `status: 'pending'`.
        *   Use `Promise.allSettled` or sequential processing (`for...of` loop with `await`) to handle API calls for each item.
        *   Update item status in `@offlineQueue` during processing.
        *   On success: Save summary data, save thumbnail via `expo-file-system`, update local storage (`@summaries`), remove from `@offlineQueue`. Trigger sync for the new summary.
        *   On failure: Update status and `failureReason` in `@offlineQueue`.
    *   **Background Task:** Use Expo's `expo-background-fetch` or `TaskManager` API to register a task that checks for network connectivity and triggers `processOfflineQueue` periodically when the app is backgrounded. Note iOS/Android background execution limitations. This ensures processing can start even if the user doesn't immediately foreground the app after regaining connection.
    *   **Synchronization:** Implement a `syncChanges` function triggered on regaining connectivity. This function reads the `@syncLog`, makes corresponding API calls to the backend (e.g., PATCH /summaries/{id}/star, DELETE /summaries/{id}), and clears the log items on success.
    *   **State Management:** Use a global state manager (Zustand recommended for simplicity, Redux for complex state) to hold network status, queue status, and potentially cached data for reactive UI updates.

*   **7.2 Backend (Python FastAPI):**
    *   No fundamental changes required for core summarization endpoints (`/summarize`).
    *   Ensure endpoints are robust to handle potentially delayed requests coming from the queue.
    *   Implement or ensure idempotency for state-changing operations triggered by the sync logic (e.g., starring/deleting) if necessary, although client-side sequencing should minimize issues.
    *   Consider adding endpoints for explicit sync status if needed, but likely manageable client-side.

*   **7.3 Database (MongoDB):**
    *   Schema needs to support storing starred status (`starred: boolean`).
    *   Ensure appropriate indexing (e.g., on `userId`, `videoId`) for efficient querying during sync and history loading.

*   **7.4 Error Handling:**
    *   Implement comprehensive `try...catch` blocks around network calls, file system operations, local DB operations, and queue processing logic.
    *   Handle specific errors: network unavailable (`NetInfo`), storage full (`FileSystem` or DB errors), API errors (4xx, 5xx), `yt-dlp` errors, AI generation errors.
    *   Provide clear user feedback for errors, especially for failed queued items. Log detailed errors locally or to a remote logging service for debugging.

**8. Success Metrics**

*   **SM8.1:** Number/Percentage of user sessions involving offline summary access.
*   **SM8.2:** Number of summary requests successfully processed via the offline queue.
*   **SM8.3:** Queue failure rate (and common reasons for failure).
*   **SM8.4:** Average loading time improvement for cached summaries vs. network fetch.
*   **SM8.5:** User engagement/retention metrics, particularly for users identified as frequently offline.
*   **SM8.6:** App Store reviews/user feedback specifically mentioning offline capabilities.
*   **SM8.7:** Cache utilization metrics (average size per user, frequency of cache clearing).

**9. Release Criteria**

*   **RC9.1:** All Functional Requirements (Section 4) are implemented and verified through testing.
*   **RC9.2:** All Non-Functional Requirements (Section 5) are met, particularly regarding performance, reliability, and storage.
*   **RC9.3:** UI/UX implementation (Section 6) is complete, intuitive, and aligns with the app's design system.
*   **RC9.4:** Thorough testing completed, including:
    *   Simulated offline scenarios (airplane mode).
    *   Transitions between network states (Wi-Fi -> Cellular -> Offline -> Wi-Fi).
    *   Queue processing with multiple items, including successes and failures.
    *   Background fetch/task execution for queue processing.
    *   Cache management (LRU eviction, manual clearing).
    *   Sync logic validation.
    *   Edge case testing (storage full, invalid URLs in queue, app restart during processing).
*   **RC9.5:** No critical or major bugs related to offline functionality remain open.
*   **RC9.6:** User-facing documentation or tooltips explaining offline features are prepared.
