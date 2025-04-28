Okay, here is a Product Requirements Document (PRD) for the feature "Allow the user to enter their own API key".

---

**Product Requirements Document: User-Provided API Key**

**1. Introduction**

*   **Feature:** Allow users to input and use their own Google Gemini API key within the YTSummarizer application. show that the user-provided key is needed for the app to function correctly on the homescreen.
*   **Overview:** Currently, YTSummarizer uses a centrally managed API key for interacting with the Google Gemini service. This feature will introduce an option for users to provide their personal Gemini API key. When a user provides their key, the application will use it for all subsequent summary generation requests made by that user, potentially bypassing default rate limits or costs associated with the app's built-in key.
*   **Context:** This feature provides flexibility for users who may have their own Gemini API subscriptions, higher usage quotas, or prefer to manage their own API usage costs and tracking. It can also serve as a mechanism for the application maintainers to manage API costs associated with heavy usage.

**2. Goals**

*   **User Empowerment:** Allow users to leverage their own Gemini API subscriptions/quotas for potentially faster or unrestricted summary generation.
*   **Cost Management (Developer):** Potentially reduce the API cost burden on the application developer by shifting usage to user keys for those who opt-in.
*   **Transparency:** Give users more control and visibility over the API calls being made on their behalf.
*   **Flexibility:** Provide an alternative usage model for power users or those hitting potential limits of a shared key.

**3. Non-Goals**

*   **Supporting other AI provider keys:** This feature is specifically for Google Gemini API keys at this stage.
*   **Validating key subscription level/quota:** The app will attempt to use the key provided; validation will occur implicitly during the API call. The app will not check the key's specific plan or remaining quota beforehand.
*   **Complex key management:** The initial implementation will focus on storing and using a single user-provided key. Features like managing multiple keys or sharing keys are out of scope.
*   **Providing API Keys:** The application will not provide users with API keys; users are expected to obtain their own keys from Google AI Studio or Google Cloud.

**4. User Stories**

*   **As a user with my own Gemini API key, I want to enter it into the YTSummarizer app, so that my summary requests use my personal API quota and I'm not subject to the app's shared limits.**
*   **As a user, I want the app to securely store my API key, so I don't have to re-enter it every time.**
*   **As a user, I want to be able to easily remove my API key from the app, so I can revert to using the app's default key or stop using my key.**
*   **As a user, I want clear feedback if the API key I entered is invalid or fails during a summary generation attempt, so I can correct it or remove it.**
*   **As a developer/maintainer, I want users to have the option to use their own key, so that the app's operational API costs can be potentially reduced.**

**5. Functional Requirements**

*   **5.1. Settings UI:**
    *   A dedicated section within the app's settings screen (e.g., "API Key" or "Advanced Settings").
    *   An input field for the user to paste their Gemini API Key. This field should obscure the input (e.g., using password dots).
    *   A "Save" or "Apply" button to store the entered key.
    *   A "Clear" or "Remove" button to delete the stored user key.
    *   Informational text explaining what the API key is for, where to get one (link to Google AI documentation), and the implications of using their own key (e.g., responsibility for usage costs/quotas).
    *   A visual indicator showing whether a custom key is currently active.

*   **5.2. Key Storage:**
    *   The user-provided API key must be stored securely on the device.
    *   Utilize platform-specific secure storage mechanisms (e.g., `Expo SecureStore`, Keychain on iOS, Keystore on Android).
    *   The key should **not** be stored in plain text (e.g., in AsyncStorage, local files, or insecure databases).

*   **5.3. API Call Logic:**
    *   **Frontend:** Before initiating a summary generation request to the backend:
        *   Check if a user-provided API key is securely stored.
        *   If a key exists, include it securely in the request to the backend (e.g., in an HTTP header like `X-User-API-Key`).
        *   If no user key exists, make the request normally (allowing the backend to use its default key).
    *   **Backend (FastAPI):**
        *   Modify the relevant API endpoint(s) (e.g., `/summarize`) to optionally accept a user-provided API key from the request header.
        *   If a user key is provided in the request:
            *   Use this key when initializing the Gemini client or making the call to the Gemini API.
            *   **Crucially: Do NOT store the user's API key persistently on the backend.** Use it only for the duration of the request.
        *   If no user key is provided in the request, use the backend's default configured Gemini API key.

*   **5.4. Error Handling:**
    *   If an API call made using a user-provided key fails due to an invalid/revoked key or quota issues (e.g., 401, 403, 429 errors from Gemini):
        *   The backend should relay an appropriate error message back to the frontend.
        *   The frontend should display a user-friendly error message indicating the problem might be with their provided API key (e.g., "Summary generation failed. Please check if your API key is valid and has sufficient quota.").
    *   Handle potential errors during secure storage/retrieval of the key on the client-side.

*   **5.5. Default Behavior:**
    *   If the user has not entered their own API key, the application functions exactly as it does now, using the centrally managed key configured in the backend.

**6. Design & UX Considerations**

*   **Clarity:** Clearly label the input field and provide concise instructions.
*   **Security:** Emphasize that the key is stored securely on their device. Use masked input fields.
*   **Feedback:** Provide immediate feedback upon saving or clearing the key. Show clear error messages if API calls fail due to key issues.
*   **Discoverability:** Place the setting in a logical location (e.g., under a general "Settings" or "Advanced" menu). It shouldn't be intrusive for users who don't need it.
*   **Reversibility:** Make it easy for users to clear their key and revert to the default behavior.

**7. Technical Considerations**

*   **Frontend:** Use `expo-secure-store` for cross-platform secure storage. Update API service calls to conditionally include the key header.
*   **Backend:** Modify FastAPI endpoint(s) to read the optional header. Update the Gemini client initialization logic to use the provided key if present. Ensure the backend environment securely stores its *own* default key.
*   **Security:** Prioritize secure handling and transmission of the API key. Avoid logging user keys on the backend. Use HTTPS for all communication.
*   **Platform Consistency:** Ensure the feature works consistently across iOS, Android, and Web PWA. Secure storage might have slightly different underlying implementations but `expo-secure-store` abstracts this.

**8. Success Metrics**

*   **Adoption Rate:** Percentage of active users who have entered their own API key.
*   **Error Rate:** Monitor API errors specifically related to user-provided keys (e.g., authentication failures).
*   **Developer API Usage:** Track changes in the usage/cost of the central developer API key after feature launch (expecting a potential decrease if adoption is significant).
*   **User Feedback:** Qualitative feedback from users regarding the feature's usability and usefulness.
*   **Successful Generations:** Track the number of successful summary generations using user-provided keys vs. the default key.

**9. Open Questions / Future Considerations**

*   What is the exact wording for user instructions and warnings regarding key usage and responsibility?
Answer: The instructions should be clear and concise, e.g., "By entering your own API key, you are responsible for any usage costs incurred. Ensure your key is valid and has sufficient quota."
*   Should there be a fallback mechanism? (e.g., if user key fails, silently try the default key? - *Probably not*, as it hides the issue from the user).
-   no, the user should be made aware of the failure to use their key.
*   Consider adding a "Test Key" button that makes a simple, low-cost call to Gemini to verify the key works before saving?
-   yes, this could be a good idea to prevent users from entering invalid keys.
*   Future: Support for API keys from other providers (OpenAI, Anthropic, etc.)?
-   This is out of scope for the current feature but could be considered in future iterations if demand exists.