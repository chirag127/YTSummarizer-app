# YouTube Summarizer Sharing Functionality

This document explains how the YouTube Summarizer app handles shared content from other apps, particularly YouTube links.

## Overview

The app now supports receiving YouTube links shared from other apps (like the YouTube app or web browsers) via the Android and iOS share menus. When a user shares a YouTube link to the app, it will:

1. Automatically receive the shared link
2. Populate the input field with the link
3. Start the summarization process without requiring user confirmation

## Implementation Details

The sharing functionality is implemented using:

1. `react-native-receive-sharing-intent` package for handling shared content on Android
2. Intent filters in `app.json` for registering as a share target
3. Custom event emitter for communication between components
4. Deep linking for iOS

## How It Works

### Android

1. When a user shares content from another app, the Android share sheet appears with our app listed
2. If the user selects our app, the shared content is received by `react-native-receive-sharing-intent`
3. The app extracts any YouTube URLs from the shared content
4. If a valid YouTube URL is found, it's automatically processed for summarization

### iOS

1. On iOS, the app uses URL schemes and associated domains to handle shared content
2. When a user shares a YouTube link, the app can be selected from the share sheet
3. The app receives the shared URL and processes it automatically

## Testing the Sharing Functionality

### Android

1. Open the YouTube app or a web browser with a YouTube video
2. Tap the share button
3. Select "YTSummarizer" from the share menu
4. The app should open, populate the URL field, and automatically start generating a summary

### iOS

1. Open the YouTube app or Safari with a YouTube video
2. Tap the share button
3. Select "YTSummarizer" from the share menu
4. The app should open and automatically process the shared URL

## Troubleshooting

If the sharing functionality doesn't work as expected:

1. Check that the app is properly registered as a share target in the system
2. Verify that the shared content is being received by looking at the console logs
3. Make sure the app has the necessary permissions
4. For iOS, ensure that the URL schemes and associated domains are correctly configured

## Development vs. Production

**Important Note**: The sharing functionality using `react-native-receive-sharing-intent` will only work in a production build, not in the Expo Go app or development builds. This is because the native module requires a fully built native app to access the necessary Android/iOS APIs.

-   When testing in Expo Go, you might see errors like:
    -   `TypeError: Cannot read property 'getFileNames' of null`
    -   `TypeError: _reactNativeReceiveSharingIntent.default.removeListener is not a function (it is undefined)`
-   These errors are expected and can be safely ignored during development
-   The code includes checks to only use the native module in production builds
-   We've added additional safeguards to check if methods exist before calling them

## Building for Testing

To test the sharing functionality, you need to create a development build using EAS (Expo Application Services):

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies if you haven't already
npm install --legacy-peer-deps

# Build for Android development
eas build -p android --profile development

# Or build for Android preview (installable APK)
eas build -p android --profile preview

# For iOS
eas build -p ios --profile development
```

## Technical Notes

-   The app uses intent filters with MIME type `text/plain` to receive shared URLs on Android
-   The `ReceiveSharingIntent.getReceivedFiles()` method is used to get content when the app is launched from a share
-   The `ReceiveSharingIntent.addListener()` method is used to listen for shares while the app is running
-   A custom event emitter is used to communicate between App.js and AppNavigator.js
-   The app automatically processes YouTube URLs without requiring user confirmation
