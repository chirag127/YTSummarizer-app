# YouTube Summarizer

A cross-platform application that generates concise summaries of YouTube videos using Gemini 2.0 Flash-Lite AI and provides text-to-speech capabilities.

eas build -p android --profile preview

## Features

-   Input YouTube video links via pasting or direct sharing from other apps
-   Generate AI-powered summaries with customizable type and length
-   Listen to summaries using text-to-speech with adjustable settings
-   View, manage, and share your history of generated summaries
-   Works on iOS, Android, and Web (as a Progressive Web App)

## Tech Stack

-   **Frontend**: React Native Expo (JavaScript)
-   **Backend**: Python FastAPI
-   **Database**: MongoDB
-   **AI Model**: Google Gemini 2.0 Flash-Lite
-   **Video Processing**: yt-dlp

## Project Structure

```
youtube-summarizer/
├── frontend/         # React Native Expo application
└── backend/          # Python FastAPI application
```

## Setup and Installation

### Prerequisites

-   Node.js and npm
-   Python 3.8+
-   MongoDB
-   Google Gemini API key

### Backend Setup

1. Navigate to the backend directory:

    ```
    cd backend
    ```

2. Install dependencies:

    ```
    pip install -r requirements.txt
    ```

3. Create a `.env` file based on `.env.example` and add your configuration:

    ```
    MONGODB_URI=mongodb://localhost:27017
    DATABASE_NAME=youtube_summarizer
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

4. Run the server:
    ```
    python run.py
    ```

### Frontend Setup

1. Navigate to the frontend directory:

    ```
    cd frontend
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Start the development server:

    ```
    npm start
    ```

4. Run on specific platforms:
    ```
    npm run android
    npm run ios
    npm run web
    ```

## API Endpoints

-   `GET /`: Health check
-   `POST /validate-url`: Validate a YouTube URL and check for transcript availability
-   `POST /generate-summary`: Generate a summary for a YouTube video
-   `GET /summaries`: Get all stored summaries
-   `GET /summaries/{summary_id}`: Get a specific summary by ID
-   `PUT /summaries/{summary_id}`: Update a summary with new parameters
-   `DELETE /summaries/{summary_id}`: Delete a summary

## Sharing Functionality

The app supports receiving YouTube links shared directly from other apps (like YouTube, browsers, etc.):

-   On Android, the app appears in the share sheet when sharing links from other apps
-   When a YouTube link is shared with the app, it automatically opens and begins the summarization process
-   See the [SHARING_FUNCTIONALITY.md](SHARING_FUNCTIONALITY.md) file for more details on implementation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

-   Google Gemini 2.0 Flash-Lite for AI summarization
-   yt-dlp for YouTube video processing
-   Expo for cross-platform mobile development
