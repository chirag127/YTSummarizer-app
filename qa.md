Okay, here is a Product Requirements Document (PRD) for the AI-powered Q&A feature for the YTSummarizer application, built to be comprehensive for the final product state of this specific feature, leaving nothing *for this feature's core functionality* to a later phase.

---

**Product Requirements Document (PRD)**

**Feature:** AI-Powered Video Content Q&A

**Product:** YTSummarizer (React Native Expo, Python FastAPI, MongoDB)

**Version:** 1.0 (Initial Comprehensive Scope)

**Date:** October 27, 2023

**Author:** [Your Name/Team]

---

**1. Introduction**

The YTSummarizer application currently provides AI-generated summaries of YouTube videos. This PRD outlines the requirements for adding an AI-powered Question & Answer feature, allowing users to interact more deeply with the video content by asking specific questions and receiving answers derived from the video's transcript via the AI model. This feature leverages the existing infrastructure for fetching video transcripts and utilizing the Google Gemini 2.0 Flash-Lite model.

**2. Goals**

*   Enable users to quickly find specific information within a video without watching it entirely.
*   Increase user engagement by providing an interactive way to explore video content beyond static summaries.
*   Leverage the existing transcript fetching and AI processing capabilities.
*   Position YTSummarizer as a more versatile video understanding tool.
*   Provide a seamless and intuitive Q&A experience integrated within the existing summary view.

**3. User Stories**

*   As a user, I want to ask specific questions about the content of a summarized video so I can find precise information quickly.
*   As a user, I want to see the AI's answer presented clearly in a conversational format.
*   As a user, I want to be able to ask follow-up questions within the same conversation context.
*   As a user, I want the app to clearly indicate when the AI is processing my question.
*   As a user, I want the app to handle cases where it cannot find an answer in the video transcript and inform me.
*   As a user, I want the conversation history for a video to be saved so I can refer back to it later.
*   As a user, I want to be able to copy the AI's answer.
*   As a user, I want the app to gracefully handle videos that do not have available transcripts.

**4. Functional Requirements**

*   **FR.QA.1:** The application MUST provide a clear entry point to the Q&A feature from the generated summary view for a specific video.
*   **FR.QA.2:** The Q&A interface MUST be a dedicated screen or modal accessible from the summary view.
*   **FR.QA.3:** The Q&A interface MUST display the video thumbnail and title for context.
*   **FR.QA.4:** The interface MUST provide a text input field for users to type their questions.
*   **FR.QA.5:** The interface MUST provide a mechanism (e.g., a send button) to submit the user's question.
*   **FR.QA.6:** Upon submission, the application MUST display the user's question in a chat-like interface.
*   **FR.QA.7:** The application MUST display a clear loading/processing indicator while waiting for the AI's response.
*   **FR.QA.8:** Upon receiving the AI's response, the application MUST display the AI's answer in the chat-like interface, clearly distinguishable from the user's questions.
*   **FR.QA.9:** The Q&A session MUST maintain context, allowing users to ask follow-up questions that build upon previous turns.
*   **FR.QA.10:** The AI's answers MUST be based *solely* on the content of the video's transcript.
*   **FR.QA.11:** If the AI cannot find an answer to the user's question within the video's transcript, it MUST explicitly state that the information is not available in the video.
*   **FR.QA.12:** All Q&A conversation turns for a specific video MUST be stored persistently (in MongoDB).
*   **FR.QA.13:** When a user revisits the Q&A feature for a video, the entire previous conversation history for that video MUST be loaded and displayed.
*   **FR.QA.14:** The application MUST provide an option to copy the AI's individual answer text to the device clipboard.
*   **FR.QA.15:** The application MUST gracefully handle videos for which no transcript is available (e.g., display a message stating Q&A is not possible without a transcript).
*   **FR.QA.16:** The backend MUST link Q&A history to the specific `videoId` and potentially the `userId` (if user accounts are implemented or planned).
*   **FR.QA.17:** The backend MUST manage the conversation history token limit when sending context to the AI model (e.g., by truncating older messages or summarizing if necessary).
*   **FR.QA.18:** The frontend MUST handle and display error messages clearly if the Q&A generation fails (e.g., network error, backend error, AI error).

**5. Non-Functional Requirements**

*   **NFR.QA.1:** **Performance:** AI responses should be returned within a reasonable time frame (target: 5-15 seconds depending on question complexity and model load).
*   **NFR.QA.2:** **Reliability:** The feature must have robust error handling for network issues, AI API failures, and backend errors.
*   **NFR.QA.3:** **Scalability:** The backend Q&A endpoint must be designed to handle concurrent requests as user base grows.
*   **NFR.QA.4:** **Usability:** The Q&A interface must be intuitive, easy to navigate, and visually consistent with the rest of the app.
*   **NFR.QA.5:** **Data Integrity:** Q&A history must be accurately stored and retrieved, linked correctly to the corresponding video.
*   **NFR.QA.6:** **Cost Efficiency:** The implementation should consider the cost implications of repeated AI calls and transcript processing, optimizing where possible (e.g., efficient transcript retrieval, managing conversation history size).

**6. UI/UX Requirements**

*   **UI.QA.1:** Add a prominent button or section on the video summary screen labeled something like "Ask a Question about this Video" or "Chat with Video AI".
*   **UI.QA.2:** Design a dedicated Q&A screen or modal with a title bar showing the video title.
*   **UI.QA.3:** The screen layout should mimic a standard chat interface with user input at the bottom and conversation history above.
*   **UI.QA.4:** Use distinct visual styles (e.g., background color, bubble shape) for user questions and AI answers.
*   **UI.QA.5:** Display a clear, animated indicator (e.g., "AI is typing...") while the AI response is being generated.
*   **UI.QA.6:** Implement smooth scrolling for the conversation history, allowing users to view older messages.
*   **UI.QA.7:** Provide a dedicated button or long-press option on AI answer bubbles to trigger the copy functionality.
*   **UI.QA.8:** Clearly display a message when a transcript is unavailable for the video, disabling the Q&A feature for that video.
*   **UI.QA.9:** Ensure keyboard handling is correct (keyboard appearing doesn't obscure the input field).
*   **UI.QA.10:** The input field should clear automatically after a question is sent.

**7. Technical Implementation Details**

*   **Frontend (React Native Expo):**
    *   Create a new React Native screen component (`QAScreen.js`) or implement it as a modal.
    *   Integrate a text input component and a button for submitting questions.
    *   Utilize state management (e.g., React Context, Redux Toolkit, or useState with proper structure) to manage the conversation history array.
    *   Implement UI rendering logic to map the conversation history array to chat bubble components.
    *   Add logic to display loading state while waiting for backend response.
    *   Implement fetch calls to a new backend API endpoint (`POST /api/v1/videos/:videoId/qa`). Send the current user question and the relevant conversation history from the frontend state/storage in the request body.
    *   Implement error handling for API calls and display appropriate messages to the user.
    *   Use Expo's `expo-clipboard` module for the copy functionality.
    *   Persist the conversation history locally (e.g., using `AsyncStorage`) as a fallback or for immediate display before backend sync, although the primary source should be the backend DB for robustness and multi-device support if applicable. The backend will be the source of truth for loading history.
*   **Backend (Python FastAPI):**
    *   Create a new FastAPI endpoint, e.g., `POST /api/v1/videos/{video_id}/qa`. This endpoint will accept the `video_id`, the `user_question`, and potentially the `chat_history` (an array of previous turns).
    *   Implement logic to retrieve the stored transcript for the given `video_id` from MongoDB. Handle cases where the transcript does not exist.
    *   Implement prompt engineering for the Gemini 2.0 Flash-Lite model. The prompt MUST instruct the model to answer based *only* on the provided transcript and to state if the information is not found. The prompt will include the transcript, the conversation history (managing token limits), and the current user question.
    *   Call the Google Gemini API using the `google-generativeai` Python library. Use the chat-based interaction if supported by Flash-Lite, sending the history.
    *   Process the AI's response. Check for potential content moderation flags or errors from the API.
    *   Implement logic to store the user's question and the AI's response in MongoDB. This should be stored in a new collection (e.g., `video_chats`) linked to the `videoId`.
    *   Database schema for `video_chats` collection:
        ```
        {
          _id: ObjectId,
          videoId: string, // Link to the video
          userId: ObjectId, // Link to user (if user accounts exist)
          history: [
            {
              role: "user" | "model",
              content: string,
              timestamp: Date
            }
          ],
          createdAt: Date,
          updatedAt: Date
        }
        ```
    *   Implement logic to retrieve the conversation history from the `video_chats` collection when the frontend requests it (e.g., on loading the Q&A screen for a video). This might be a separate `GET` endpoint or integrated into the `POST` response. A separate `GET` endpoint is cleaner for initial load.
    *   Implement comprehensive error handling for:
        *   Database errors (transcript not found, history storage/retrieval issues).
        *   Gemini API errors (API keys, rate limits, model issues, content filtering).
        *   Transcript processing errors (e.g., malformed data).
    *   Consider the need for handling very long transcripts that exceed the model's context window. Potential strategies (if passing the whole transcript isn't feasible for common videos):
        *   **Truncation:** Simply cut off the transcript at the token limit (least ideal).
        *   **Summarization:** Summarize the transcript first, then ask questions based on the summary (might lose detail).
        *   **Retrieval Augmented Generation (RAG):** Chunk the transcript, embed the chunks and the user question, find the most relevant chunks using vector similarity search, and include *only* those relevant chunks in the prompt to Gemini. This is more complex but generally provides better results for long documents. *Given the "final product" constraint for *this feature*, RAG should be considered if initial testing shows that many relevant videos have transcripts exceeding the context window.* Let's specify that the implementation *must* handle long transcripts, and RAG is the preferred robust method if simple truncation/full-pass is insufficient.
*   **Database (MongoDB):**
    *   Create a new collection, `video_chats`, as described above, specifically for storing Q&A conversation history. This keeps Q&A data separate from summary data but linked by `videoId`.
    *   Index the `videoId` and `userId` fields for efficient querying.
*   **Transcript Handling (`yt-dlp`):** Ensure the process of fetching and storing transcripts via `yt-dlp` is robust, as this feature relies entirely on the transcript data. Need to handle videos where `yt-dlp` cannot retrieve a transcript (e.g., no captions available, private video).

**8. Analytics & Tracking**

*   Track the number of times the Q&A feature is accessed per video.
*   Track the number of questions asked per session.
*   Track the average length of Q&A sessions (number of turns).
*   Track the average response time for AI answers.
*   Track the rate of "cannot answer" responses from the AI.
*   Track the rate of errors (backend, AI API).

**9. Open Questions / Risks**

*   **Handling Long Transcripts:** The primary technical challenge will be effectively handling transcripts that exceed the Gemini model's context window. Implementing RAG adds significant complexity but is likely necessary for a robust "final product" feature capable of handling arbitrary video lengths. A decision point early in development will be whether to pursue RAG immediately or start with a simpler strategy (like truncation or summary-based prompting) and evaluate its limitations. *As per the "final product" constraint for *this feature's scope*, the chosen strategy must be robust enough for common long videos, leaning towards RAG if simpler methods fail.*
*   **AI Accuracy and Reliability:** The AI's ability to accurately answer questions based *solely* on the transcript can vary. Robust prompt engineering and error handling are crucial.
*   **Cost:** While Gemini Flash is low-cost, high usage could still accumulate costs. Monitoring and potential backend-level rate limiting (beyond user experience loading states) might be considered for extreme cases, though not a core user-facing requirement.
*   **Prompt Injection:** Users might try to bypass the instruction to answer *only* from the transcript. Prompt engineering must include safety mechanisms against this.
*   **Videos Without Transcripts:** Need a clear and user-friendly way to communicate that Q&A is not possible for such videos.

**10. Out of Scope (for this specific feature's current scope)**

*   Asking questions *across* multiple videos simultaneously.
*   Asking questions about the generated *summary* itself (vs. the original video content).
*   Highlighting or linking AI answers directly to specific timestamps in the video (this would be a significant *future* enhancement).
*   Allowing users to edit or delete specific messages within the Q&A history. (Deletion of the *entire* history for a video could be considered later, but not required for the initial comprehensive scope).

---