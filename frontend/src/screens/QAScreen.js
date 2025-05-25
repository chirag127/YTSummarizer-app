import React, { useState, useRef, useEffect } from "react";
import {
    StyleSheet,
    View,
    Alert,
    SafeAreaView,
    Keyboard,
    Platform,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import NetInfo from "@react-native-community/netinfo";

import { getVideoQAHistory, askVideoQuestion } from "../services/api";
import { useTimeZone } from "../context/TimeZoneContext";
import { useTheme } from "../context/ThemeContext";
import useThemedStyles from "../hooks/useThemedStyles";
import * as analytics from "../services/analytics";
import {
    speakText,
    stopSpeaking,
    isSpeaking,
    setSpeechCallbacks,
    clearSpeechCallbacks,
    processTextForSpeech,
} from "../services/tts";
import { parseMarkdownToPlainText } from "../utils";

// Import modular components
import Header from "../components/qa/Header";
import MessageList from "../components/qa/MessageList";
import InputArea from "../components/qa/InputArea";
import LoadingIndicator from "../components/qa/LoadingIndicator";
import ErrorDisplay from "../components/qa/ErrorDisplay";
import NoTranscriptError from "../components/qa/NoTranscriptError";
import InitialLoading from "../components/qa/InitialLoading";
import getMarkdownStyles from "../components/qa/MarkdownStyles";

const QAScreen = ({ route, navigation }) => {
    // Get video info from route params
    const { summary } = route.params || {};

    // Get theme colors
    const { colors } = useTheme();

    // Get markdown styles with theme colors
    const markdownStylesWithTheme = getMarkdownStyles(colors);

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        keyboardAvoidingContainer: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between", // This ensures the input stays at the bottom
        },
        messagesContainer: {
            flex: 1, // Takes up available space, pushing input to bottom
            backgroundColor: colors.background,
        },
    }));

    // Extract video ID from various URL formats
    const extractVideoId = (url) => {
        if (!url) return null;

        // Standard YouTube URL: youtube.com/watch?v=VIDEO_ID
        if (url.includes("v=")) {
            return url.split("v=")[1].split("&")[0];
        }

        // Short YouTube URL: youtu.be/VIDEO_ID
        if (url.includes("youtu.be/")) {
            return url.split("youtu.be/")[1].split("?")[0];
        }

        // Live YouTube URL: youtube.com/live/VIDEO_ID
        if (url.includes("/live/")) {
            return url.split("/live/")[1].split("?")[0];
        }

        // If the URL itself looks like a video ID (11-12 characters)
        if (
            url.length >= 11 &&
            url.length <= 12 &&
            !url.includes("/") &&
            !url.includes(".")
        ) {
            return url;
        }

        return null;
    };

    // Try to extract video ID from multiple sources
    let videoId = null;

    if (summary) {
        // Try direct video_id property
        if (summary.video_id) {
            videoId = summary.video_id;
        }
        // Try extracting from video_url
        else if (summary.video_url) {
            videoId = extractVideoId(summary.video_url);
        }
        // Try extracting from id property
        else if (summary.id) {
            videoId = extractVideoId(summary.id);
        }
    }

    const videoTitle = summary ? summary.video_title : "Video Q&A";
    const videoThumbnail = summary ? summary.video_thumbnail_url : null;

    // Get time zone context
    const { formatDateWithTimeZone } = useTimeZone();

    // State
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasTranscript, setHasTranscript] = useState(true); // Will be checked on component mount
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isOffline, setIsOffline] = useState(false);
    const [questionData, setQuestionData] = useState(null);
    const [error, setError] = useState(null);
    const [isRetrying, setIsRetrying] = useState(false);
    const [tokenCount, setTokenCount] = useState(0); // Store the total token count
    const [transcriptTokenCount, setTranscriptTokenCount] = useState(0); // Store the transcript token count
    const [keyboardHeight, setKeyboardHeight] = useState(0); // Store keyboard height for animation

    // TTS state
    const [isPlayingTTS, setIsPlayingTTS] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] = useState(null);
    const [currentWord, setCurrentWord] = useState(null);
    const [currentSentence, setCurrentSentence] = useState(0);
    const [processedTexts, setProcessedTexts] = useState({});

    // Refs
    const flatListRef = useRef(null);
    const inputRef = useRef(null);
    const messageRefs = useRef({});
    const sentenceRefs = useRef({});
    const wordRefs = useRef({});

    // Function to load chat history
    const loadChatHistory = async (forceTranscript = false) => {
        setError(null);
        setIsRetrying(false);

        try {
            const response = await getVideoQAHistory(videoId, forceTranscript);
            if (response.history) {
                setMessages(response.history);
            }

            // Extract token counts from response
            if (response.token_count !== undefined) {
                setTokenCount(response.token_count);
                console.log("Total token count:", response.token_count);
            }

            if (response.transcript_token_count !== undefined) {
                setTranscriptTokenCount(response.transcript_token_count);
                console.log(
                    "Transcript token count:",
                    response.transcript_token_count
                );
            }

            // Always set transcript to available for testing
            setHasTranscript(true);
            console.log("Transcript availability:", response.has_transcript);
        } catch (error) {
            console.error("Error loading chat history:", error);

            if (error.response?.status === 404) {
                // Force transcript to be available even on 404
                setHasTranscript(true);
            } else if (error.message === "Network Error") {
                setError({
                    type: "network",
                    message:
                        "Network error. Please check your connection and try again.",
                });
            } else if (error.code === "ECONNABORTED") {
                setError({
                    type: "timeout",
                    message: "Request timed out. Please try again.",
                });
            } else {
                setError({
                    type: "unknown",
                    message: `Error loading chat history: ${error.message}`,
                });
            }
        } finally {
            setIsInitialLoad(false);
        }
    };

    // Function to retry loading chat history
    const retryLoadChatHistory = () => {
        setIsRetrying(true);
        setIsInitialLoad(true);
        loadChatHistory(true); // Force transcript to be available
    };

    // Store session data for analytics
    const [sessionData, setSessionData] = useState(null);

    // Set navigation title and load chat history
    useEffect(() => {
        navigation.setOptions({
            title: "Ask Questions",
        });

        // Initialize analytics
        analytics.initializeAnalytics();

        // Track Q&A session start only if we have a valid videoId
        if (videoId) {
            const data = analytics.trackQASessionStart(videoId);
            setSessionData(data);
        } else {
            console.log(
                "Cannot track Q&A session: No valid video ID available"
            );
        }

        // Load chat history on mount only if we have a valid videoId
        if (videoId) {
            loadChatHistory();
        } else {
            setIsInitialLoad(false);
            setError({
                type: "invalid_id",
                message:
                    "No valid video ID found. Please try again with a valid YouTube video.",
            });
        }

        // Setup speech callbacks for word highlighting
        setSpeechCallbacks({
            onBoundary: (event) => {
                // Update the current word with the information from the event
                setCurrentWord({
                    word: event.word,
                    sentenceIndex: event.sentenceIndex,
                    wordIndex: event.wordIndex,
                });
                setCurrentSentence(event.sentenceIndex);
            },
            onStart: (sentenceIndex) => {
                setCurrentSentence(sentenceIndex || 0);
                setCurrentWord(null);
            },
            onDone: () => {
                setCurrentWord(null);
                setIsPlayingTTS(false);
                setSpeakingMessageId(null);
            },
            onStopped: () => {
                setCurrentWord(null);
                setIsPlayingTTS(false);
                setSpeakingMessageId(null);
            },
        });

        // Track session end when component unmounts
        return () => {
            // Stop any ongoing speech when navigating away
            stopSpeaking();
            clearSpeechCallbacks();

            if (sessionData) {
                analytics.trackQASessionEnd(sessionData, messages.length);

                // Log analytics metrics
                const metrics = analytics.getAnalyticsMetrics();
                console.log("Q&A Analytics Metrics:", metrics);
            }
        };
    }, [navigation, videoId, messages.length]);

    // Monitor network status
    useEffect(() => {
        // Subscribe to network state updates
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsOffline(!(state.isConnected && state.isInternetReachable));
        });

        // Check initial network state
        NetInfo.fetch().then((state) => {
            setIsOffline(!(state.isConnected && state.isInternetReachable));
        });

        // Cleanup subscription
        return () => unsubscribe();
    }, []);

    // Add keyboard listeners to handle keyboard events
    useEffect(() => {
        // Use different events for iOS and Android
        const keyboardShowListener =
            Platform.OS === "ios"
                ? Keyboard.addListener("keyboardWillShow", (event) => {
                      // Store keyboard height for animation
                      setKeyboardHeight(event.endCoordinates.height);
                      // Scroll to bottom when keyboard appears
                      if (flatListRef.current && messages.length > 0) {
                          setTimeout(() => {
                              flatListRef.current?.scrollToEnd({
                                  animated: true,
                              });
                          }, 100); // Small delay to ensure layout is complete
                      }
                  })
                : Keyboard.addListener("keyboardDidShow", () => {
                      // Scroll to bottom when keyboard appears
                      if (flatListRef.current && messages.length > 0) {
                          setTimeout(() => {
                              flatListRef.current?.scrollToEnd({
                                  animated: true,
                              });
                          }, 100); // Small delay to ensure layout is complete
                      }
                  });

        const keyboardHideListener =
            Platform.OS === "ios"
                ? Keyboard.addListener("keyboardWillHide", () => {
                      // Reset keyboard height
                      setKeyboardHeight(0);
                      // Scroll to bottom when keyboard hides
                      if (flatListRef.current && messages.length > 0) {
                          setTimeout(() => {
                              flatListRef.current?.scrollToEnd({
                                  animated: true,
                              });
                          }, 100); // Small delay to ensure layout is complete
                      }
                  })
                : Keyboard.addListener("keyboardDidHide", () => {
                      // Scroll to bottom when keyboard hides
                      if (flatListRef.current && messages.length > 0) {
                          setTimeout(() => {
                              flatListRef.current?.scrollToEnd({
                                  animated: true,
                              });
                          }, 100); // Small delay to ensure layout is complete
                      }
                  });

        // Clean up listeners
        return () => {
            keyboardShowListener.remove();
            keyboardHideListener.remove();
        };
    }, [messages.length]);

    // Auto-scrolling to the current word being spoken has been disabled
    // as per user request to allow manual scrolling during TTS playback
    /*
    useEffect(() => {
        if (currentWord && speakingMessageId) {
            const wordKey = `${speakingMessageId}-${currentWord.sentenceIndex}-${currentWord.wordIndex}`;
            const sentenceKey = `${speakingMessageId}-${currentWord.sentenceIndex}`;

            // First try to scroll to the highlighted word
            if (wordRefs.current[wordKey]) {
                try {
                    wordRefs.current[wordKey].measureLayout(
                        flatListRef.current,
                        (_, y) => {
                            // Scroll to the word position
                            flatListRef.current.scrollToOffset({
                                offset: y - 150, // More padding to show context above the word
                                animated: true,
                            });
                        },
                        (error) =>
                            console.log("Word measurement failed:", error)
                    );
                    return; // If word scrolling succeeds, don't try sentence or message
                } catch (error) {
                    console.log("Error measuring word:", error);
                    // Fall through to sentence scrolling
                }
            }

            // If word scrolling fails, try to scroll to the sentence
            if (sentenceRefs.current[sentenceKey]) {
                try {
                    sentenceRefs.current[sentenceKey].measureLayout(
                        flatListRef.current,
                        (_, y) => {
                            // Scroll to the sentence position
                            flatListRef.current.scrollToOffset({
                                offset: y - 120, // Padding to show context
                                animated: true,
                            });
                        },
                        (error) =>
                            console.log("Sentence measurement failed:", error)
                    );
                    return; // If sentence scrolling succeeds, don't try message
                } catch (error) {
                    console.log("Error measuring sentence:", error);
                    // Fall through to message scrolling
                }
            }

            // If all else fails, scroll to the message
            if (messageRefs.current[speakingMessageId]) {
                try {
                    messageRefs.current[speakingMessageId].measureLayout(
                        flatListRef.current,
                        (_, y) => {
                            // Scroll to the message position
                            flatListRef.current.scrollToOffset({
                                offset: y - 100, // Scroll to position with some padding
                                animated: true,
                            });
                        },
                        (error) =>
                            console.log("Message measurement failed:", error)
                    );
                } catch (error) {
                    console.log("Error measuring message:", error);
                }
            }
        }
    }, [currentWord, speakingMessageId]);
    */

    // Scroll to the end when new messages are added
    const prevMessagesLengthRef = useRef(messages.length);
    useEffect(() => {
        // Only scroll to end when a new message is added (not during initial load)
        if (messages.length > prevMessagesLengthRef.current && !isInitialLoad) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 100); // Small delay to ensure layout is complete
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages.length, isInitialLoad]);

    // Handle send message
    const handleSend = async () => {
        if (!inputText.trim()) return;

        if (!hasTranscript) {
            Alert.alert(
                "No Transcript",
                "This video does not have a transcript available. Q&A feature is not available without a transcript."
            );
            return;
        }

        const question = inputText.trim();
        setInputText(""); // Clear input

        // Create a unique ID for the user message
        const userMessageId = `user-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 11)}`;

        // Add user message to chat - this will remain visible during the API call
        const userMessage = {
            id: userMessageId,
            content: question,
            role: "user",
            timestamp: new Date().toISOString(),
        };

        // Update messages state with the user message
        setMessages((prev) => [...prev, userMessage]);

        // Show loading state
        setIsLoading(true);

        // Track question asked
        const trackingData = await analytics.trackQuestionAsked(
            videoId,
            Date.now()
        );
        setQuestionData(trackingData);

        try {
            // Get current messages to pass to API
            // We need to capture the current state before adding the user message
            // to avoid duplicating it in the API call
            const currentMessages = [...messages];

            const response = await askVideoQuestion(
                videoId,
                question,
                currentMessages
            );

            // Extract token counts from response
            if (response.token_count !== undefined) {
                setTokenCount(response.token_count);
                console.log("Updated total token count:", response.token_count);
            }

            if (response.transcript_token_count !== undefined) {
                setTranscriptTokenCount(response.transcript_token_count);
                console.log(
                    "Updated transcript token count:",
                    response.transcript_token_count
                );
            }

            // Check if response contains history with the AI's answer
            if (response.history && response.history.length > 0) {
                // Find the AI response (should be the last message from the model/assistant)
                const aiResponse = response.history.findLast(
                    (msg) => msg.role === "model" || msg.role === "assistant"
                );

                // Only add the AI response if it exists and is from the model/assistant
                if (aiResponse) {
                    const aiMessage = {
                        id:
                            aiResponse.id ||
                            response.id ||
                            `ai-${Date.now()}-${Math.random()
                                .toString(36)
                                .substring(2, 11)}`,
                        content: aiResponse.content,
                        // Normalize role to "assistant" for consistent rendering
                        role: "assistant",
                        timestamp:
                            aiResponse.timestamp || new Date().toISOString(),
                        isOffline: response.isOffline,
                    };

                    console.log("Adding AI response to chat:", aiMessage);

                    // Update messages with the AI response
                    // We use a function to ensure we're working with the latest state
                    setMessages((prevMessages) => {
                        // Check if our user message is still in the messages array
                        const hasUserMessage = prevMessages.some(
                            (msg) =>
                                msg.id === userMessageId ||
                                (msg.role === "user" &&
                                    msg.content === question)
                        );

                        // If the user message is missing, add it back along with the AI response
                        if (!hasUserMessage) {
                            return [...prevMessages, userMessage, aiMessage];
                        }

                        // Otherwise, just add the AI response
                        return [...prevMessages, aiMessage];
                    });

                    // Track answer received
                    if (!response.isOffline) {
                        const answerData = await analytics.trackAnswerReceived(
                            videoId,
                            questionData,
                            aiResponse.content
                        );

                        // Log if this was a "cannot answer" response
                        if (answerData && answerData.isCannotAnswer) {
                            console.log("AI could not answer this question");
                        }
                    }
                } else {
                    console.warn(
                        "No valid AI response found in history:",
                        response.history
                    );
                }
            } else {
                console.warn(
                    "Response does not contain history with AI answer:",
                    response
                );
            }
        } catch (error) {
            console.error("Error asking question:", error);
            Alert.alert("Error", "Failed to get answer. Please try again.");

            // Track error
            await analytics.trackQAError("api_error");
        } finally {
            setIsLoading(false);
            setQuestionData(null);
        }
    };

    // Handle copy message
    const handleCopyMessage = async (content) => {
        try {
            // Copy the raw content (including markdown)
            await Clipboard.setStringAsync(content);
            Alert.alert("Success", "Message copied to clipboard");
        } catch (error) {
            console.error("Error copying message:", error);
            Alert.alert("Error", "Failed to copy message");
        }
    };

    // Handle text-to-speech for a message
    const handleSpeakMessage = async (message) => {
        try {
            // If already speaking this message, stop it
            if (speakingMessageId === message.id && isPlayingTTS) {
                await stopSpeaking();
                setIsPlayingTTS(false);
                setSpeakingMessageId(null);
                setCurrentWord(null);
                return;
            }

            // If speaking a different message, stop it first
            if (isPlayingTTS) {
                await stopSpeaking();
            }

            // Convert markdown to plain text for speech
            const plainText = parseMarkdownToPlainText(message.content);

            // Process text for highlighting if not already processed
            if (!processedTexts[message.id]) {
                const processed = processTextForSpeech(plainText);
                setProcessedTexts((prev) => ({
                    ...prev,
                    [message.id]: processed,
                }));
            }

            // Reset current sentence and word
            setCurrentSentence(0);
            setCurrentWord(null);

            // Start speaking
            const success = await speakText(plainText);

            if (success) {
                setIsPlayingTTS(true);
                setSpeakingMessageId(message.id);

                // Check speaking status periodically
                const checkInterval = setInterval(async () => {
                    const stillSpeaking = await isSpeaking();
                    if (!stillSpeaking) {
                        setIsPlayingTTS(false);
                        setSpeakingMessageId(null);
                        setCurrentWord(null);
                        clearInterval(checkInterval);
                    }
                }, 1000);

                // Return cleanup function
                return () => {
                    clearInterval(checkInterval);
                };
            }
        } catch (error) {
            console.error("Error speaking message:", error);
            setIsPlayingTTS(false);
            setSpeakingMessageId(null);
            setCurrentWord(null);
        }
    };

    // Render message item
    const renderMessage = ({ item }) => {
        // Determine if this is a user message
        const isUserMessage = item.role === "user";

        // Check if this message is currently being spoken
        const isBeingSpoken = speakingMessageId === item.id && isPlayingTTS;

        // Get the processed text for this message if it's being spoken
        const processedText = processedTexts[item.id];

        return (
            <TouchableOpacity
                ref={(ref) => (messageRefs.current[item.id] = ref)}
                style={[
                    styles.messageContainer,
                    isUserMessage ? styles.userMessage : styles.aiMessage,
                    item.isOffline && styles.offlineMessage,
                    isBeingSpoken && styles.speakingMessage,
                ]}
                onLongPress={() => handleCopyMessage(item.content)}
            >
                <View style={styles.messageContentContainer}>
                    {isUserMessage ? (
                        <Text
                            style={[styles.messageText, styles.userMessageText]}
                        >
                            {item.content}
                        </Text>
                    ) : isBeingSpoken && processedText ? (
                        // Render with word highlighting when being spoken
                        <View>
                            {processedText.sentences.map(
                                (sentence, sentenceIndex) => (
                                    <View
                                        key={`sentence-${item.id}-${sentenceIndex}`}
                                        ref={(ref) => {
                                            sentenceRefs.current[
                                                `${item.id}-${sentenceIndex}`
                                            ] = ref;
                                        }}
                                        style={[
                                            styles.sentenceContainer,
                                            currentSentence === sentenceIndex &&
                                                styles.activeSentence,
                                        ]}
                                    >
                                        {sentence
                                            .split(/\s+/)
                                            .map((word, wordIdx) => {
                                                // Skip empty words
                                                if (word.trim() === "")
                                                    return null;

                                                // Check if this word should be highlighted
                                                const isHighlighted =
                                                    currentWord &&
                                                    currentWord.sentenceIndex ===
                                                        sentenceIndex &&
                                                    currentWord.wordIndex ===
                                                        wordIdx;

                                                return (
                                                    <Text
                                                        key={`word-${item.id}-${sentenceIndex}-${wordIdx}`}
                                                        ref={(ref) => {
                                                            if (isHighlighted) {
                                                                // Store ref for the highlighted word
                                                                wordRefs.current[
                                                                    `${item.id}-${sentenceIndex}-${wordIdx}`
                                                                ] = ref;
                                                            }
                                                        }}
                                                        style={[
                                                            styles.word,
                                                            isHighlighted &&
                                                                styles.highlightedWord,
                                                        ]}
                                                    >
                                                        {word}{" "}
                                                    </Text>
                                                );
                                            })}
                                    </View>
                                )
                            )}
                        </View>
                    ) : (
                        <Markdown style={markdownStyles}>
                            {item.content}
                        </Markdown>
                    )}
                </View>
                <View style={styles.messageFooter}>
                    {item.isOffline && (
                        <View style={styles.offlineIndicator}>
                            <Ionicons
                                name="cloud-offline-outline"
                                size={16}
                                color={colors.error}
                            />
                            <Text style={styles.offlineText}>Offline</Text>
                        </View>
                    )}
                    <Text style={styles.timestamp}>
                        {formatDateWithTimeZone(item.timestamp)}
                    </Text>

                    {/* Only show TTS button for AI messages */}
                    {!isUserMessage && (
                        <TouchableOpacity
                            style={styles.ttsButton}
                            onPress={() => handleSpeakMessage(item)}
                        >
                            <Ionicons
                                name={isBeingSpoken ? "pause" : "volume-high"}
                                size={18}
                                color={colors.primary}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // Render loading indicator
    const renderLoading = () => (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>AI is thinking...</Text>
        </View>
    );

    // Render error component
    const renderError = () => (
        <View style={styles.errorBanner}>
            <View style={styles.errorContent}>
                <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color={colors.error}
                />
                <Text style={styles.errorMessage}>{error.message}</Text>
            </View>
            <TouchableOpacity
                style={styles.retryButton}
                onPress={retryLoadChatHistory}
                disabled={isRetrying}
            >
                {isRetrying ? (
                    <ActivityIndicator size="small" color={colors.background} />
                ) : (
                    <Text style={styles.retryButtonText}>Retry</Text>
                )}
            </TouchableOpacity>
        </View>
    );

    // If initial load, show loading screen
    if (isInitialLoad) {
        return <InitialLoading />;
    }

    // If no transcript available, show error screen with retry option
    if (!hasTranscript) {
        return <NoTranscriptError onRetry={retryLoadChatHistory} />;
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Video Info Header */}
            <Header
                videoTitle={videoTitle}
                videoThumbnail={videoThumbnail}
                transcriptTokenCount={transcriptTokenCount}
                tokenCount={tokenCount}
            />

            {/* KeyboardAvoidingView to handle keyboard appearance */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardAvoidingContainer}
                keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}
            >
                {/* Messages List with TouchableWithoutFeedback to dismiss keyboard */}
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.messagesContainer}>
                        <MessageList
                            messages={messages}
                            flatListRef={flatListRef}
                            onLongPress={handleCopyMessage}
                            onSpeakMessage={handleSpeakMessage}
                            isPlayingTTS={isPlayingTTS}
                            speakingMessageId={speakingMessageId}
                            processedTexts={processedTexts}
                            currentWord={currentWord}
                            currentSentence={currentSentence}
                            formatDateWithTimeZone={formatDateWithTimeZone}
                            markdownStyles={markdownStylesWithTheme}
                            messageRefs={messageRefs}
                            sentenceRefs={sentenceRefs}
                            wordRefs={wordRefs}
                        />

                        {isLoading && <LoadingIndicator />}
                        {error && (
                            <ErrorDisplay
                                error={error}
                                onRetry={retryLoadChatHistory}
                                isRetrying={isRetrying}
                            />
                        )}
                    </View>
                </TouchableWithoutFeedback>

                {/* Input Container - Now positioned at the bottom */}
                <InputArea
                    inputText={inputText}
                    onChangeText={setInputText}
                    onSend={handleSend}
                    isLoading={isLoading}
                    isOffline={isOffline}
                    inputRef={inputRef}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default QAScreen;
