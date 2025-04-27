Okay, here is a detailed Product Requirements Document (PRD) tailored for an AI agent tasked with building the YouTube Summarizer React Native Expo application.

**Product Requirements Document: YouTube Video Summarizer & Reader**

**Version:** 1.0
**Date:** October 26, 2023
**Author:** [Your Name/Team Name]
**Status:** Final

**1. Introduction**

**1.1. Overview**
This document outlines the requirements for a cross-platform application (iOS, Android, Web/PWA) built using React Native Expo. The application's primary function is to allow users to input YouTube video links, generate concise summaries using the Gemini 2.0 Flash-Lite AI model, store these summaries, and provide an accessible text-to-speech (TTS) feature for reading the summaries aloud with customizable audio settings.

**1.2. Goals**
*   Provide users with a quick and efficient way to understand the content of YouTube videos without watching them entirely.
*   Leverage cutting-edge AI (Gemini 2.0 Flash-Lite) for high-quality summarization.
*   Offer accessibility through a robust and customizable text-to-speech feature.
*   Enable users to manage and revisit their generated summaries easily.
*   Deliver a seamless and performant user experience across iOS, Android, and the Web (as a Progressive Web App).
*   Build a production-ready, maintainable, and well-documented application.

**1.3. Target Audience**
*   Students, researchers, and professionals seeking quick information from video content.
*   Individuals with limited time who want to grasp the essence of videos quickly.
*   Users who prefer auditory consumption of information or have visual impairments.
*   Anyone looking to quickly digest YouTube video content on multiple devices.

**2. High-Level Requirements**

*   **HLR1:** Users can input YouTube video links via pasting or direct sharing.
*   **HLR2:** The application generates video summaries using a backend service powered by Gemini 2.0 Flash-Lite.
*   **HLR3:** Users can customize the type and length of the generated summaries.
*   **HLR4:** Summaries are stored persistently (MongoDB) and associated with the video link, title, and thumbnail.
*   **HLR5:** Users can listen to summaries using a text-to-speech engine with adjustable speed, pitch, and voice.
*   **HLR6:** Users can view, manage (delete), and share their history of generated summaries.
*   **HLR7:** The application functions consistently across iOS, Android, and Web browsers (as an installable PWA).

**3. Technical Stack & Architecture**

*   **Frontend:** React Native Expo (JavaScript)
*   **Backend:** Python (FastAPI framework)
*   **Video Processing:** `yt-dlp` (or equivalent robust library) for fetching video metadata and transcripts/captions.
*   **AI Model:** Google Gemini 2.0 Flash-Lite (via API)
*   **Database:** MongoDB
*   **Platform:** iOS, Android, Web (Progressive Web App)

**4. Functional Requirements**

**4.1. Video Link Input & Validation**

*   **FR1.1 Paste Link:** Users must be able to paste a YouTube video URL directly into a designated text input field on the main screen.
    *   **FR1.1.1 Input Field:** A clearly labelled text input field shall be present.
    *   **FR1.1.2 Paste Action:** Standard paste functionality (long-press, context menu, keyboard shortcut) must be supported.
*   **FR1.2 Share-to-App:** Users must be able to share a YouTube video link directly from the native YouTube application (iOS/Android) or web browser into this app, triggering the summarization process.
    *   **FR1.2.1 Deep Linking Setup:** The app must register the necessary intent filters (Android) and URL schemes (iOS) to appear in the native share sheet for YouTube URLs.
    *   **FR1.2.2 Link Handling:** Upon receiving a shared link, the app should automatically populate the input field or directly initiate the summarization process.
*   **FR1.3 Client-Side Validation:** Initial validation of the input URL should occur on the client-side before sending to the backend.
    *   **FR1.3.1 Validation Logic:** The validation should primarily check if the URL domain is `youtube.com` or `youtu.be`. A simple regex like `/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/` is sufficient for this initial check. More complex validation is deferred to the backend.
    *   **FR1.3.2 User Feedback:** If the client-side validation fails, the user should receive immediate, clear feedback (e.g., input field border turns red, helper text appears) indicating the link is not a valid YouTube URL.
*   **FR1.4 Backend Validation:** The backend must perform comprehensive validation of the received URL to ensure it points to a valid, accessible YouTube video. This is the definitive validation step.

**4.2. Summary Generation**

*   **FR2.1 Triggering Generation:** Summary generation is triggered after a valid YouTube link is submitted (either via paste + submit button or via share-to-app).
*   **FR2.2 Backend Process:**
    *   **FR2.2.1 Metadata Fetching:** The backend service (using `yt-dlp` or similar) must attempt to fetch the video's title and a thumbnail URL.
    *   **FR2.2.2 Transcript/Caption Fetching:** The backend must attempt to fetch the video's transcript or captions. This is critical for summarization.
    *   **FR2.2.3 AI Summarization:** If transcripts/captions are available, the backend sends them along with the user-selected `summaryType` and `summaryLength` parameters to the Gemini 2.0 Flash-Lite API.
    *   **FR2.2.4 Response Handling:** The backend receives the generated summary text from the Gemini API.
*   **FR2.3 Summary Parameters Selection:**
    *   **FR2.3.1 Summary Type:** Users must be able to select the desired summary type before initiating generation.
        *   Options: "Brief", "Detailed", "Key Point".
        *   UI: Use clear selection controls (e.g., Radio buttons, Segmented control, Dropdown).
        *   Default: "Brief".
    *   **FR2.3.2 Summary Length:** Users must be able to select the desired summary length before initiating generation.
        *   Options: "Short", "Medium", "Long".
        *   UI: Use clear selection controls (e.g., Radio buttons, Segmented control, Dropdown).
        *   Default: "Medium".
    *   **FR2.3.3 Persistence:** The user's last selected type and length should be remembered for subsequent sessions (using AsyncStorage or similar).
*   **FR2.4 Cancellation:** Users must have a way to cancel a summary generation request while it is in progress.
    *   **FR2.4.1 UI:** A clearly visible "Cancel" button or icon should appear during the generation process (e.g., alongside a loading indicator).
    *   **FR2.4.2 Backend Communication:** Clicking "Cancel" should send a signal to the backend (if feasible architecture-wise) to halt processing for that request, or at minimum, the frontend should discard the result when it arrives. The frontend should immediately revert to the input state.
*   **FR2.5 Loading/In-Progress State:** The UI must clearly indicate when summary generation is in progress (e.g., loading spinner, progress bar, disabled input field/button).
*   **FR2.6 Transcript Unavailability:** If the backend determines that a video has no available transcripts or captions, it must not proceed with the Gemini API call.
    *   **FR2.6.1 User Notification:** The application must clearly inform the user that the video cannot be summarized due to the lack of transcripts/captions. This should be displayed as a user-friendly error message.
*   **FR2.7 Metadata Fetching Failure:** Failure to fetch the video title or thumbnail URL should *not* prevent the summary generation from proceeding, provided transcripts are available.
    *   **FR2.7.1 Graceful Handling:** If metadata fetching fails, the summary should still be generated and stored. Placeholder values or indicators (e.g., default thumbnail, "Title Unavailable" text) should be used in the display.

**4.3. Summary Display & Interaction**

*   **FR3.1 Card Format:** Generated summaries must be displayed in a distinct card format upon successful generation. Each card must contain:
    *   **FR3.1.1 Video Title:** The fetched video title. Display placeholder text (e.g., "Title Unavailable") if fetching failed.
    *   **FR3.1.2 Video Thumbnail:** The fetched video thumbnail image. Display a default placeholder image if fetching failed or the URL is invalid.
    *   **FR3.1.3 Summary Text:** The summary text received from the Gemini API.
    *   **FR3.1.4 Markdown Rendering:** The summary text must be rendered supporting standard Markdown formatting (e.g., headings, bold, italics, lists). Use a suitable React Native Markdown rendering library.
    *   **FR3.1.5 Summary Type:** Display the type used for generation (Brief, Detailed, Key Point).
    *   **FR3.1.6 Summary Length:** Display the length used for generation (Short, Medium, Long).
    *   **FR3.1.7 Read Aloud Button:** A button/icon to trigger the text-to-speech functionality for this summary.
    *   **FR3.1.8 Share Button:** A button/icon to share the generated summary text.
    *   **FR3.1.9 Delete Button:** A button/icon to delete this summary from history.
    *   **FR3.1.10 Edit Button:** A button/icon allowing the user to change the summary type and length for *this specific video* and regenerate the summary.
*   **FR3.2 Edit Functionality:**
    *   **FR3.2.1 Trigger:** Tapping the Edit button should open a modal or navigate to a view allowing re-selection of Summary Type and Length for the current video.
    *   **FR3.2.2 Regeneration:** Submitting the changes should trigger a new summary generation request to the backend with the original video link and the new parameters.
    *   **FR3.2.3 Update:** The existing summary entry (in history and storage) should be updated with the new summary text, type, and length upon successful regeneration.
*   **FR3.3 Sharing Summaries:**
    *   **FR3.3.1 Trigger:** Tapping the Share button on a summary card.
    *   **FR3.3.2 Action:** Invokes the native platform share sheet (using `Expo Sharing` module).
    *   **FR3.3.3 Content:** The shared content should be the summary text, potentially prefixed or suffixed with context like the video title or link (e.g., "Summary for '[Video Title]':\n\n[Summary Text]\n\nOriginal Video: [Video URL]").

**4.4. Text-to-Speech (TTS)**

*   **FR4.1 Activation:** Users must be able to activate TTS by tapping the "Read Aloud" button on any summary card.
*   **FR4.2 Playback Control:** Basic playback controls must be available when TTS is active (Play, Pause, Stop). These controls should ideally be visually associated with the summary being read.
*   **FR4.3 Universality:** The TTS feature must be available for all summaries, regardless of their type or length.
*   **FR4.4 Settings Accessibility:** TTS settings (Speed, Pitch, Voice) must be adjustable via a dedicated "Settings" screen within the app.
*   **FR4.5 Speed Adjustment:**
    *   **FR4.5.1 Control:** Provide a slider or similar control for adjusting playback speed.
    *   **FR4.5.2 Range:** The speed must be adjustable from a baseline (e.g., 0.5x) up to 16x the normal speed. Clearly label the control.
    *   **FR4.5.3 Application:** Changes to speed should take effect immediately (or on the next play action).
*   **FR4.6 Pitch Adjustment:**
    *   **FR4.6.1 Control:** Provide a slider or similar control for adjusting playback pitch.
    *   **FR4.6.2 Range:** Provide a reasonable range for pitch adjustment (e.g., 0.5x to 2.0x). Clearly label the control.
    *   **FR4.6.3 Application:** Changes to pitch should take effect immediately (or on the next play action).
*   **FR4.7 Voice Selection:**
    *   **FR4.7.1 Control:** Provide a selection mechanism (e.g., dropdown, list) for choosing the TTS voice.
    *   **FR4.7.2 Voice Options:** The available voices should be fetched from the underlying native TTS engine (`expo-speech` relies on system voices). The list should display available voices based on the device's OS and language settings.
    *   **FR4.7.3 Application:** Changes to voice should take effect immediately (or on the next play action).
*   **FR4.8 Settings Persistence:** Selected TTS settings (speed, pitch, voice) must be saved locally (e.g., AsyncStorage) and persist across app sessions.
*   **FR4.9 Audio Feedback:** Provide clear visual indication when TTS is playing, paused, or stopped. Highlight the text being read if possible (using TTS events).

**4.5. History Management**

*   **FR5.1 History Screen:** A dedicated screen or section must display a list of all previously generated and stored summaries.
*   **FR5.2 List Format:** Each entry in the history list must display at minimum:
    *   The Video Thumbnail (using placeholder if unavailable).
    *   The Video Title (using placeholder if unavailable).
*   **FR5.3 Chronological Order:** History items should be displayed in reverse chronological order (most recent first) by default.
*   **FR5.4 Navigation:** Tapping a history item should navigate the user to a view displaying the full summary card (as defined in FR3.1) for that item.
*   **FR5.5 Deletion:**
    *   **FR5.5.1 Trigger:** Users must be able to delete individual summaries from the history list (e.g., via swipe-to-delete gesture or a delete button on the list item) or from the full summary view (via the delete button on the card).
    *   **FR5.5.2 Confirmation:** A confirmation prompt (e.g., "Are you sure you want to delete this summary?") must be shown before deletion.
    *   **FR5.5.3 Action:** Confirmed deletion removes the summary from the UI and the persistent storage (MongoDB).
*   **FR5.6 Empty State:** The history screen should display a user-friendly message when no summaries have been generated yet.
*   **FR5.7 Hamburg Menu Link Display:** Within the Hamburg menu (or a similar global navigation element), display the original YouTube video link associated with the currently viewed summary (if applicable contextually, e.g., if viewing a summary navigated from history). *Correction/Clarification:* This seems slightly misplaced. Let's refine: The *original video link* should be easily accessible *from the summary display card*, perhaps as a tappable element or an explicit "View Original Video" button/link. The Hamburg menu is typically for app-level navigation (Home, History, Settings).

**4.6. Settings Screen**

*   **FR6.1 Access:** A dedicated "Settings" screen accessible from the main navigation (e.g., Tab bar, Hamburg menu).
*   **FR6.2 TTS Configuration:** This screen must contain the controls for adjusting TTS settings as defined in FR4.5 (Speed), FR4.6 (Pitch), and FR4.7 (Voice).
*   **FR6.3 Other Settings (Optional but Recommended):** Consider adding options like "Clear History", "Rate App", "About", "Privacy Policy".

**5. Non-Functional Requirements**

*   **NFR1. Performance:**
    *   **NFR1.1 Responsiveness:** The UI must remain responsive during background tasks like API calls and TTS processing. Use asynchronous operations effectively.
    *   **NFR1.2 Load Time:** App startup time should be minimized. PWA load times should be optimized.
    *   **NFR1.3 Backend Efficiency:** Backend processing (transcript fetching, AI call) should be optimized for speed. Consider caching transcripts if feasible and compliant with YouTube's ToS.
*   **NFR2. Usability:**
    *   **NFR2.1 Intuitiveness:** Navigation and core actions (pasting, generating, reading, managing history) must be intuitive and easy to discover.
    *   **NFR2.2 Feedback:** Provide clear visual feedback for user actions, loading states, success messages, and error conditions.
    *   **NFR2.3 Consistency:** Maintain a consistent design language and interaction patterns across all screens and platforms.
*   **NFR3. Platform Compatibility & PWA:**
    *   **NFR3.1 iOS/Android:** Ensure full functionality and consistent UI/UX on supported versions of iOS and Android.
    *   **NFR3.2 Web:** Ensure full functionality on modern web browsers (Chrome, Firefox, Safari, Edge).
    *   **NFR3.3 PWA:** The web version must be a Progressive Web App, installable to the user's home screen/desktop, and offer basic offline capabilities (e.g., viewing cached history if app architecture supports it, showing an offline notice otherwise). Configure the necessary manifest file and service worker.
*   **NFR4. Maintainability & Code Quality:**
    *   **NFR4.1 Modularity:** Structure the frontend (React Native) and backend (FastAPI) code into logical, reusable modules/components/services as requested. Follow standard project structure conventions (`frontend/`, `backend/`).
    *   **NFR4.2 Documentation:** Code must be well-commented, especially complex logic, API interactions, and state management. Generate API documentation for the backend (FastAPI can auto-generate).
    *   **NFR4.3 Best Practices:** Adhere to established best practices for React Native, Expo, Python, FastAPI, and MongoDB development. Use linters and formatters.
    *   **NFR4.4 Testability:** Write unit and integration tests for critical components and backend endpoints.
*   **NFR5. Reliability & Error Handling:**
    *   **NFR5.1 Graceful Failure:** The app should handle API errors, network issues, and unexpected data gracefully, informing the user appropriately without crashing.
    *   **NFR5.2 Comprehensive Handling:** Implement specific error handling for scenarios outlined in FR2.6 (No Transcripts), FR2.7 (Metadata Fail), FR1.3/FR1.4 (Invalid Link), Gemini API errors, database connection errors, network timeouts, etc.
*   **NFR6. Security:**
    *   **NFR6.1 API Key Security:** Ensure the Gemini API key is stored securely on the backend and not exposed in the frontend code.
    *   **NFR6.2 Input Sanitization:** Sanitize user input (URLs) on the backend to prevent potential injection attacks, even though `yt-dlp` handles URL parsing.

**6. Data Management**

*   **DM1. Storage:** MongoDB will be used for persistent storage.
*   **DM2. Schema:** A `summaries` collection should store documents with at least the following fields:
    *   `_id`: ObjectId (Primary Key)
    *   `videoUrl`: String (Indexed)
    *   `videoTitle`: String (Optional, store placeholder if unavailable)
    *   `videoThumbnailUrl`: String (Optional, store placeholder if unavailable)
    *   `summaryText`: String (The generated summary in Markdown)
    *   `summaryType`: String (Enum: "Brief", "Detailed", "Key Point")
    *   `summaryLength`: String (Enum: "Short", "Medium", "Long")
    *   `createdAt`: ISODate
    *   `updatedAt`: ISODate
    *   *(Consider adding `deviceId` or a unique identifier if needing to scope data without full user accounts)*
*   **DM3. Data Flow:** Frontend sends URL + parameters -> Backend fetches data, calls Gemini -> Backend stores result in MongoDB -> Backend sends result to Frontend -> Frontend displays and caches locally if needed (e.g., for history). History screen fetches list from Backend based on stored data.

**7. UI/UX Design Considerations**

*   **UXC1. Simplicity:** Prioritize a clean, uncluttered interface focused on the core task of summarizing videos.
*   **UXC2. Clarity:** Use clear typography, iconography, and spacing. Ensure interactive elements are easily identifiable.
*   **UXC3. Navigation:** Implement straightforward navigation (e.g., bottom tab bar for Home/Input, History, Settings).
*   **UXC4. Loading States:** Utilize non-intrusive loading indicators (e.g., spinners, skeleton screens) during data fetching and processing.
*   **UXC5. Accessibility:** Use sufficient color contrast, support dynamic font sizes where feasible, and ensure interactive elements have adequate touch targets.

**8. Release Criteria / Acceptance Criteria**

*   **AC1:** All Functional Requirements (FR section 4) are implemented and function as described.
*   **AC2:** All Non-Functional Requirements (NFR section 5) are met, particularly regarding performance, usability across platforms, and PWA installability.
*   **AC3:** The application operates without crashes or critical bugs on targeted iOS, Android, and Web platforms.
*   **AC4:** Text-to-Speech functions correctly with all customization options (speed up to 16x, pitch, voice selection).
*   **AC5:** History is correctly stored, displayed, managed (deletion), and shared.
*   **AC6:** Error handling is implemented for all key scenarios (invalid link, no transcript, API errors, network issues).
*   **AC7:** Codebase is well-structured, modular, commented, and follows specified best practices.
*   **AC8:** Backend API endpoints are functional and secured (API key).
*   **AC9:** The application passes basic usability testing.

**9. Final Instructions for the AI Agent**

*   **Adherence:** Strictly follow all requirements outlined in this document.
*   **Completeness:** Deliver a feature-complete, production-ready application, not an MVP. All specified features must be implemented.
*   **Quality:** Ensure the code is robust, well-documented, modular, maintainable, and adheres to industry best practices for the specified technology stack (React Native Expo, Python FastAPI, MongoDB).
*   **Testing:** Implement appropriate testing (unit, integration) and perform thorough manual testing across all target platforms (iOS, Android, Web/PWA) to ensure stability and functionality.
*   **Cross-Platform Compatibility:** Guarantee seamless operation and a consistent user experience across iOS, Android, and Web (including PWA installation and functionality).
*   **User Experience:** Focus on creating a user-friendly, intuitive, and performant application.
*   **Communication:** (If applicable in the interaction model) Report any ambiguities or necessary deviations from this PRD promptly.

This PRD provides a comprehensive guide for building the YouTube Summarizer application. The AI agent is expected to interpret these requirements and deliver a high-quality, fully functional product meeting all specifications.

The following is the example of gemini 2.0 flash-lite API call:

```python
import base64
import os
from google import genai
from google.genai import types


def generate():
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    model = "gemini-2.0-flash-lite"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="""INSERT_INPUT_HERE"""),
            ],
        ),
    ]
    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
    )

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        print(chunk.text, end="")

if __name__ == "__main__":
    generate()
```

The time taken should be saved in the database 