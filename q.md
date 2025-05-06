add a button to regenrate the summary on the summaryscrenn This regenerate button will regenerate the summary of the youtube video completely newly It dont show the previous summary It will trigger a new generation of the summary don't use the existing updateSummary function to make this functionality as the app is shwoing the same summary again when using this function, create a new function name regenerate new sumary

Improve the performance of the app implement optimization in the app as I have only 0.1 cpu and 512mb ram in the backend , strictly don't remove any of the comments and importantly adn strictly don't touch any gemini code as you hallucinate a lot on that code


Implement the button to show the transcript of the youtube video on the summary screen, this button will show the transcript of the youtube video in a new screen,

YTSummarizer is a cross-platform application (with focus on Android) that helps users quickly understand YouTube video content through AI-powered summaries. Here are its main features:

1. Video Input:
- Users can paste YouTube video URLs directly
- Supports sharing videos from YouTube app or browsers through the native share menu
- Automatically processes valid YouTube URLs

2. Summary Generation:
- Uses Google Gemini AI model to generate summaries
- Offers different summary types (Brief, Detailed, Key Points, Chapters)
- Allows different summary lengths (Short, Medium, Long)
- Shows metadata like generation time

3. Summary Features:
- Shows video thumbnail and title
- Displays summaries with Markdown formatting
- Has a "Read Aloud" text-to-speech feature with adjustable settings (speed, pitch, voice)
- Supports copying, sharing, and starring summaries
- Allows generating multiple summary types for the same video

4. History Management:
- Keeps track of generated summaries
- Allows filtering starred summaries
- Supports deleting unwanted summaries
- Shows multiple summaries for the same video with different types/lengths

5. Technical Implementation:
- Frontend: React Native Expo
- Backend: Python FastAPI
- Database: MongoDB for storing summaries
- Uses yt-dlp for fetching video metadata and transcripts
- Implements offline functionality and caching
- Has error handling and loading states

The app is designed to provide a seamless experience across platforms with a focus on usability and performance. The backend uses Redis caching to improve performance and reduce load on the YouTube API, while the frontend implements features like offline support and background playback for text-to-speech.

give me a prd for Improve the performance of this app and implement optimization in the app as I have only 0.1 cpu and 512mb ram in the backend , importantly and strictly don't remove any of the comments and importantly and strictly don't touch any gemini code as you hallucinate a lot on that code. don't remove any existing comments or modify the core Gemini interaction code don't remove existing code or modify the core functionality of the app, just optimize the existing code and implement the new features as described. don't modify any of the yt-dlp code as it is important for the app to work properly
