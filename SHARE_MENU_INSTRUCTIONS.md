# YouTube Summarizer Share Menu Integration

This document provides instructions for building and testing the YouTube Summarizer app with the share menu functionality.

## Overview

The app now supports receiving YouTube links shared from other apps (like the YouTube app or web browsers) via the Android share menu. When a user shares a YouTube link to the app, it will:

1. Automatically receive the shared link
2. Populate the input field with the link
3. Start the summarization process without requiring user confirmation

## Implementation Details

The share menu functionality is implemented using:

1. `react-native-share-menu` package for handling shared content
2. Intent filters in `app.json` for registering as a share target
3. Custom handlers in `HomeScreen.js` for processing shared links

## Building the App

To build the app with share menu functionality, you need to create a development build using EAS (Expo Application Services):

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies if you haven't already
npm install --legacy-peer-deps

# Build for Android development
eas build -p android --profile development

# Or build for Android preview (installable APK)
eas build -p android --profile preview
```

## Testing the Share Menu Functionality

1. Install the built app on your Android device
2. Open the YouTube app or a web browser with a YouTube video
3. Tap the share button
4. Select "YTSummarizer" from the share menu
5. The app should open, populate the URL field, and automatically start generating a summary

## Troubleshooting

If the share menu functionality doesn't work as expected:

1. Check that the app is properly registered as a share target in the Android system
2. Verify that the shared content is being received by looking at the console logs
3. Make sure the app has the necessary permissions

## Technical Notes

- The app uses intent filters with MIME type `text/plain` to receive shared URLs
- The `ShareMenu.getInitialShare()` method is used to get content when the app is launched from a share
- The `ShareMenu.addNewShareListener()` method is used to listen for shares while the app is running
- The app automatically processes YouTube URLs without requiring user confirmation

## Building for Production

For production builds, use:

```bash
eas build -p android --profile production
```

This will create a production-ready build that can be submitted to the Google Play Store.
