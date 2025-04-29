Okay, here is a detailed Product Requirements Document (PRD) for the **Background Playback** feature of the YTSummarizer application, incorporating the requested implementation details and aiming for the final product state.

---

**Product Requirements Document: YTSummarizer - Background TTS Playback**

**1. Introduction**

*   **Feature:** Background Text-to-Speech (TTS) Playback
*   **Product:** YTSummarizer (React Native Expo Android App)
*   **Date:** October 26, 2023
*   **Version:** 1.0
*   **Author:** [Your Name/Team Name]
*   **Overview:** This document outlines the requirements for implementing background audio playback for the Text-to-Speech (TTS) "Read Aloud" feature within the YTSummarizer application. This enhancement will allow users to continue listening to generated summaries even when the application is minimized, running in the background, or when the device screen is locked, providing a seamless and uninterrupted listening experience similar to standard music or podcast apps.

**2. Goals**

*   **Enhance User Convenience:** Allow users to multitask (e.g., check emails, browse web) while listening to summaries.
*   **Provide Continuous Listening:** Enable listening during commutes or other activities where the screen might be off (e.g., phone in pocket).
*   **Increase Engagement:** Encourage longer listening sessions by removing the constraint of keeping the app active and in the foreground.
*   **Improve Accessibility:** Offer a hands-free listening option that persists across app states.
*   **Align with User Expectations:** Meet the standard expectation for audio playback features in mobile applications.

**3. User Stories**

*   **As a user, I want** to start listening to a summary using the "Read Aloud" feature **so that** I can switch to another app or lock my phone without the audio stopping, allowing me to multitask or save battery.
*   **As a user, I want** to control the background audio playback (play, pause, stop) from a system notification **so that** I don't have to reopen YTSummarizer just to manage the audio.
*   **As a user, I want** the audio playback to intelligently handle interruptions like incoming phone calls **so that** I don't miss important calls and the playback can resume appropriately afterward.
*   **As a user, I want** a clear indication that audio is playing in the background and an easy way to return to the app from the notification **so that** I always know what's playing and can access the full app controls if needed.

**4. Functional Requirements**

| ID  | Requirement                                     | Description                                                                                                                                                                                                                            | Priority |
| :-- | :---------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------- |
| FR-BP-001 | **Continuous Background Playback**          | TTS audio initiated via the "Read Aloud" feature must continue playing without interruption when the YTSummarizer app is moved to the background (e.g., user presses Home button, switches apps).                                | Must Have  |
| FR-BP-002 | **Playback with Screen Lock**               | TTS audio must continue playing when the device screen is locked or turned off.                                                                                                                                                        | Must Have  |
| FR-BP-003 | **Persistent Media Notification**           | When TTS is playing and the app is not in the foreground, a persistent media-style notification must be displayed in the system notification tray. This notification serves as the primary UI for background control.              | Must Have  |
| FR-BP-004 | **Notification Content**                    | The notification must display: <br> a) YTSummarizer App Icon <br> b) Title of the YouTube video associated with the summary <br> c) A clear indicator that TTS summary audio is playing (e.g., "Playing Summary")                       | Must Have  |
| FR-BP-005 | **Notification Play/Pause Control**         | The notification must include a Play/Pause toggle button. Pressing Pause should halt playback but keep the notification active. Pressing Play should resume playback from where it was paused. The button state should reflect the current playback status. | Must Have  |
| FR-BP-006 | **Notification Stop Control**               | The notification must include a distinct "Stop" button. Pressing Stop must cease audio playback entirely, dismiss the notification, and release audio resources/focus. This is different from Pause.                            | Must Have  |
| FR-BP-007 | **Notification Navigation**                 | Tapping the main body of the notification (excluding the controls) should bring the YTSummarizer app to the foreground, ideally navigating back to the specific summary screen that was being read.                                  | Must Have  |
| FR-BP-008 | **Audio Focus Management**                  | The app must correctly request and manage Android's audio focus. Playback should automatically pause or duck (lower volume) when another app requests primary audio focus (e.g., incoming call, another media app starts). | Must Have  |
| FR-BP-009 | **Interruption Handling & Resumption**      | After an interruption (e.g., phone call ends), the app should attempt to automatically resume playback if appropriate (e.g., if the interruption was transient and focus is regained). If resumption is not possible/desired, playback should remain paused. | Must Have  |
| FR-BP-010 | **Foreground Transition**                   | When the app is brought back to the foreground while TTS is playing in the background, the playback should continue seamlessly, and the persistent notification should be dismissed (as in-app controls are now available).        | Must Have  |
| FR-BP-011 | **Resource Management**                     | When playback is stopped (via notification Stop button or user stopping it within the app), the background service, audio resources, and notification must be properly released to conserve battery and system resources.        | Must Have  |
| FR-BP-012 | **State Synchronization**                   | The playback state (playing, paused, current position) must be synchronized between the background service/notification and the in-app UI when transitioning between foreground and background.                               | Must Have  |
| FR-BP-013 | **Settings Persistence**                    | TTS settings configured by the user (speed, pitch, voice) before starting playback must be applied and maintained during background playback. These settings are *not* adjustable from the notification itself.                | Must Have  |
| FR-BP-014 | **Error Handling - Background**           | If an error occurs during background playback (e.g., TTS engine fails, audio resource issue), the notification should ideally update to indicate an error state, playback should stop, and the notification may offer a way to dismiss or retry (if feasible). | Must Have  |

**5. Non-Functional Requirements**

| ID    | Requirement               | Description                                                                                                                               | Priority |
| :---- | :------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------- | :------- |
| NFR-BP-001 | **Performance**           | Background playback should have minimal impact on overall device performance and responsiveness.                                        | Must Have  |
| NFR-BP-002 | **Battery Consumption**   | The background audio service should be optimized for low battery consumption. Use foreground services appropriately on Android.           | Must Have  |
| NFR-BP-003 | **Reliability**           | Background playback should be stable and avoid unexpected crashes or termination under normal operating conditions and interruptions. | Must Have  |
| NFR-BP-004 | **Responsiveness**        | Notification controls (Play/Pause, Stop) should respond promptly to user interaction (within 1 second).                               | Must Have  |
| NFR-BP-005 | **Compatibility**         | The feature must function correctly across the range of supported Android versions defined for the YTSummarizer app.                      | Must Have  |
| NFR-BP-006 | **Usability**             | The notification controls should be intuitive and follow standard Android media notification patterns.                                | Must Have  |

**6. Design & UI/UX**

*   **In-App UI:**
    *   No major changes required to the existing summary screen UI.
    *   When TTS is active and the app is in the foreground, the standard playback controls (Play/Pause, progress bar, speed/pitch/voice settings) remain the primary interaction points.
*   **System Notification (Background/Locked Screen):**
    *   **Style:** Utilize Android's standard `MediaStyle` notification for consistent look and feel with other media apps.
    *   **Layout:**
        *   Small Icon: YTSummarizer app icon.
        *   Large Icon (Optional but Recommended): Video thumbnail associated with the summary.
        *   Content Title: YouTube Video Title.
        *   Content Text: "YTSummarizer - Reading Summary" or similar.
        *   Actions (Displayed prominently):
            *   Pause Button (changes to Play icon when paused)
            *   Stop Button
    *   **Lock Screen:** The notification should appear on the lock screen with the same controls, consistent with Android media playback behavior.
    *   **Color:** Notification accents should ideally use the app's primary color theme if possible via notification channels.
    *   **Persistence:** The notification must be ongoing/persistent (not easily swipe-dismissible) while audio is actively playing or paused in the background. It should only be dismissible via the "Stop" button or when playback finishes/errors out and stops.

**7. Technical Implementation Details**

*   **Core Library:** Utilize `expo-av` for managing audio playback.
    *   Reference: [https://docs.expo.dev/versions/latest/sdk/audio/](https://docs.expo.dev/versions/latest/sdk/audio/)
*   **Background Audio Mode:** Configure `expo-av` for background playback:
    *   Use `Audio.setAudioModeAsync` with appropriate settings:
        *   `allowsRecordingIOS: false`
        *   `playsInSilentModeIOS: true` (though primarily for Android, good practice)
        *   `interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX`
        *   `interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS` (Ducks other audio like navigation; consider `DO_NOT_MIX` if preferred)
        *   `shouldDuckAndroid: true`
        *   `playThroughEarpieceAndroid: false`
        *   `staysActiveInBackground: true` **(Crucial for background playback)**
*   **Android Foreground Service:**
    *   To ensure reliable background playback on Android (preventing the OS from killing the process), implement playback within an Android Foreground Service.
    *   Use `expo-notifications` or a dedicated background task library (`expo-task-manager` if needed for more complex tasks, though likely overkill for just audio) to manage the foreground service lifecycle.
    *   The foreground service is *required* to display the persistent notification.
    *   Start the foreground service when TTS playback begins *and* the app anticipates potentially going into the background. Stop the service when playback is explicitly stopped.
    *   Configure the notification channel for media playback appropriately.
*   **Notification Management:**
    *   Use `expo-notifications` to create and update the persistent media notification.
        *   Reference: [https://docs.expo.dev/versions/latest/sdk/notifications/](https://docs.expo.dev/versions/latest/sdk/notifications/)
    *   The notification needs to be created with `NotificationContentInput` specifying the title, body, icon, and importantly, the `categoryIdentifier` set to something like `Playback` or `Media` to potentially get system media handling.
    *   Implement notification action handlers (for Play/Pause, Stop) that communicate back to the audio playback logic (likely via event listeners or state management).
*   **Audio Focus Handling:**
    *   Leverage `expo-av`'s built-in audio focus handling via the `interruptionModeAndroid` setting in `setAudioModeAsync`.
    *   Listen for audio focus changes using `Audio.setOnAudioFocusChangeListener` to implement custom pause/resume logic if the default behavior isn't sufficient (e.g., deciding *whether* to resume after a call).
*   **State Management:**
    *   Use React Context API or a state management library (like Zustand, Redux Toolkit) to manage the global playback state (isPlaying, isPaused, currentPosition, isLoading, error, associatedSummaryId, etc.).
    *   This state needs to be accessible by both the foreground UI components and the background audio logic/notification handlers to ensure consistency.
*   **TTS Engine Integration:**
    *   The TTS engine (`expo-speech` or a custom implementation if streaming TTS data) needs to feed audio data or control commands to the `expo-av` `Sound` object.
    *   Ensure the TTS generation/streaming doesn't block the main thread, especially during background playback.
*   **App Lifecycle:**
    *   Use React Native's `AppState` API to detect transitions between foreground and background states to manage notification display/dismissal and potentially service lifecycle.

**8. Error Handling**

*   **Playback Failure:** If `expo-av` reports an error during playback (e.g., cannot load audio segment, decoding error):
    *   Stop playback immediately.
    *   Update the notification to show an error state (e.g., change text to "Playback Error").
    *   Allow dismissal of the error notification.
    *   Log the error for debugging.
*   **Notification Failure:** Handle potential errors in creating or updating the system notification (e.g., permissions issues, though less likely with foreground service). Log appropriately. Playback might continue without controls if this fails silently.
*   **Service Failure:** Handle scenarios where the Android Foreground Service fails to start or is unexpectedly killed (though unlikely if configured correctly). Log the event. Playback will stop.
*   **Loss of Audio Focus (Permanent):** If audio focus is permanently lost and cannot be regained, ensure playback stops cleanly and the notification is updated/dismissed.

**9. Acceptance Criteria**

*   **AC-BP-001:** Starting "Read Aloud" and pressing the Home button continues audio playback uninterrupted.
*   **AC-BP-002:** A persistent media notification appears in the system tray when the app is backgrounded during TTS playback.
*   **AC-BP-003:** The notification displays the app icon, video title, and Play/Pause/Stop controls.
*   **AC-BP-004:** Pressing Pause on the notification halts audio; pressing Play resumes audio. The icon updates accordingly.
*   **AC-BP-005:** Pressing Stop on the notification halts audio and dismisses the notification.
*   **AC-BP-006:** Tapping the notification body brings the YTSummarizer app to the foreground.
*   **AC-BP-007:** Starting "Read Aloud" and locking the device screen continues audio playback uninterrupted.
*   **AC-BP-008:** Lock screen controls (if enabled by the system for media) mirror the notification controls.
*   **AC-BP-009:** Receiving an incoming phone call automatically pauses the TTS playback.
*   **AC-BP-010:** After ending the phone call, TTS playback automatically resumes (or remains paused, based on implementation choice for interruption handling).
*   **AC-BP-011:** Bringing the app back to the foreground while TTS is playing dismisses the notification and shows the in-app controls reflecting the current state.
*   **AC-BP-012:** Stopping playback from within the app (if foregrounded after background playback) correctly stops audio and releases resources.
*   **AC-BP-013:** User-defined TTS settings (speed, pitch, voice) are correctly applied during background playback.
*   **AC-BP-014:** Background playback functions reliably for extended periods (e.g., 10+ minutes) without crashing or stopping unexpectedly (barring system interruptions).
*   **AC-BP-015:** Battery usage during background playback is reasonable and comparable to other audio streaming apps.

**10. Open Questions / Future Considerations**

*   **Decision:** How exactly should transient vs. permanent audio focus loss be handled regarding auto-resumption? (Default: Resume after transient loss like calls, stay paused after permanent loss like another media app starting). *Decision for this PRD: Implement default behavior.*
*   **Future:** Add skip forward/backward controls to the notification? (Decision: *Out of scope for this PRD* - keep it simple with Play/Pause/Stop initially for the final product as defined).
*   **current:** Show playback progress (time elapsed/remaining or a progress bar) in the notification? (Decision: implement. This feature will enhance user experience by providing real-time feedback on playback status and duration..)

---