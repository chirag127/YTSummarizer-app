# YouTube Summarizer Frontend

This is the frontend application for the YouTube Summarizer, built with React Native Expo. It provides a cross-platform (iOS, Android, Web/PWA) interface for generating and managing AI-powered summaries of YouTube videos.

## Features

-   Input YouTube video URLs for summarization via direct entry or sharing from other apps
-   Customize summary type and length
-   View generated summaries with markdown formatting
-   Text-to-speech functionality with adjustable settings
-   History management for previously generated summaries
-   Share summaries with others
-   Progressive Web App (PWA) support

## Project Structure

```
frontend/
├── assets/            # Static assets (images, icons)
├── src/
│   ├── components/    # Reusable UI components
│   ├── constants/     # App constants and configuration
│   ├── hooks/         # Custom React hooks
│   ├── navigation/    # Navigation configuration
│   ├── screens/       # App screens
│   ├── services/      # API and service integrations
│   └── utils/         # Utility functions
├── App.js             # Main app component
└── app.json           # Expo configuration
```

## Setup

1. Install dependencies:

    ```
    npm install
    ```

2. Start the development server:

    ```
    npm start
    ```

3. Run on specific platforms:
    ```
    npm run android
    npm run ios
    npm run web
    ```

## Dependencies

-   React Native & Expo: Core framework
-   React Navigation: Screen navigation
-   Axios: API requests
-   Expo Speech: Text-to-speech functionality
-   React Native Markdown Display: Markdown rendering
-   AsyncStorage: Local data persistence

## Configuration

Update the API base URL in `src/services/api.js` to point to your backend server.

## Sharing Functionality

The app supports receiving YouTube links shared directly from other apps:

-   The app registers as a share target for YouTube URLs on both Android and iOS
-   When a user shares a YouTube link to the app, it automatically populates the input field and initiates summarization
-   This is implemented using `react-native-receive-sharing-intent` for Android and deep linking for iOS
-   See the [../SHARING_FUNCTIONALITY.md](../SHARING_FUNCTIONALITY.md) file for more details

## Building for Production

### For iOS/Android:

```
expo build:ios
expo build:android
```

### For Web (PWA):

```
expo build:web
```
