// App.js
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Linking, Platform, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useURL } from 'expo-linking';

export default function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  // This hook listens for incoming deep links
  const url = useURL();

  // Handle deep links and shared content
  useEffect(() => {
    // Function to handle incoming links
    const handleIncomingLink = async (event) => {
      let incomingUrl = event;

      // Handle the URL from the event
      if (typeof event === 'object' && event.url) {
        incomingUrl = event.url;
      }

      // Extract YouTube URL from deep link if present
      if (incomingUrl) {
        const youtubeUrl = extractYouTubeUrl(incomingUrl);
        if (youtubeUrl) {
          setVideoUrl(youtubeUrl);
          // Auto-trigger summarization
          summarizeVideo(youtubeUrl);
        }
      }
    };

    // Set up linking listeners
    if (url) {
      handleIncomingLink(url);
    }

    const subscription = Linking.addEventListener('url', handleIncomingLink);

    // Check if app was opened from a link
    Linking.getInitialURL().then(initialUrl => {
      if (initialUrl) {
        handleIncomingLink(initialUrl);
      }
    });

    // For Android intent handling (when app is already running)
    if (Platform.OS === 'android') {
      const checkClipboard = async () => {
        const clipboardContent = await Clipboard.getStringAsync();
        if (clipboardContent && isYouTubeUrl(clipboardContent) && clipboardContent !== videoUrl) {
          // Optionally show a confirmation dialog before auto-populating
          setVideoUrl(clipboardContent);
        }
      };

      // Check clipboard when app comes to foreground
      const subscription = AppState.addEventListener('change', nextAppState => {
        if (nextAppState === 'active') {
          checkClipboard();
        }
      });

      return () => {
        subscription.remove();
      };
    }

    return () => {
      subscription.remove();
    };
  }, [url]);

  // Function to extract YouTube URL from shared content
  const extractYouTubeUrl = (text) => {
    // Match patterns like https://youtu.be/ID or https://www.youtube.com/watch?v=ID
    const youtubeRegex = /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = text.match(youtubeRegex);

    if (match) {
      // Return a standardized YouTube URL
      return `https://www.youtube.com/watch?v=${match[4]}`;
    }

    return null;
  };

  // Check if a string is a YouTube URL
  const isYouTubeUrl = (text) => {
    return extractYouTubeUrl(text) !== null;
  };

  // Function to summarize the video content
  const summarizeVideo = async (url) => {
    if (!url) {
      setError('Please enter a YouTube video URL');
      return;
    }

    if (!isYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Extract video ID from URL
      const videoId = extractVideoId(url);

      // Call your summarization API here
      // This is just a placeholder - replace with your actual API call
      const response = await fetch('https://your-api-endpoint.com/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      });

      if (!response.ok) {
        throw new Error('Failed to summarize video');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error summarizing video:', error);
      setError('Failed to summarize video. Please try again.');

      // For demo purposes, set a mock summary
      setSummary('This is a placeholder summary of the YouTube video. In your production app, this would be replaced with the actual summary from your API.');
    } finally {
      setIsLoading(false);
    }
  };

  // Extract video ID from YouTube URL
  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>YouTube Video Summarizer</Text>

      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Paste YouTube URL here"
          value={videoUrl}
          onChangeText={setVideoUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={() => summarizeVideo(videoUrl)}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Summarize</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Generating summary...</Text>
        </View>
      ) : summary ? (
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Summary:</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff',
  },
  button: {
    marginLeft: 10,
    backgroundColor: '#ff0000',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
  },
});
Users must be able to share a YouTube video link directly from the native YouTube application (/Android) or web browser (via OS share sheet) into this app. Receiving a shared link should automatically populate the input field and initiate the summarization process