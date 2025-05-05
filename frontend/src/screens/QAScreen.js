import React, { useState, useRef, useEffect } from "react";
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Platform,
    SafeAreaView,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import * as Clipboard from "expo-clipboard";
import NetInfo from "@react-native-community/netinfo";

import { COLORS, SPACING, FONT_SIZES } from "../constants";
import { getVideoQAHistory, askVideoQuestion } from "../services/api";
import { useTimeZone } from "../context/TimeZoneContext";
import * as analytics from "../services/analytics";
import {
    speakText,
    stopSpeaking,
    isSpeaking,
    setSpeechCallbacks,
    clearSpeechCallbacks,
} from "../services/tts";
import {parseMarkdownToPlainText
} from "../utils";


const QAScreen = ({ route, navigation }) => {
    // Get video info from route params
    const { summary } = route.params || {};

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

    console.log("Video ID extracted:", videoId);
    console.log("Summary data:", JSON.stringify(summary, null, 2));

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
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

    // TTS state
    const [isPlayingTTS, setIsPlayingTTS] = useState(false);
    const [speakingMessageId, setSpeakingMessageId] = useState(null);

    // Refs
    const flatListRef = useRef(null);
    const inputRef = useRef(null);

    // Function to load chat history
    const loadChatHistory = async (forceTranscript = false) => {
        setError(null);
        setIsRetrying(false);

        try {
            const response = await getVideoQAHistory(videoId, forceTranscript);
            if (response.history) {
                setMessages(response.history);
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

        // Track session end when component unmounts
        return () => {
            // Stop any ongoing speech when navigating away
            stopSpeaking();

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

    // Add keyboard listeners to scroll to bottom when keyboard appears or disappears
    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            "keyboardDidShow",
            () => {
                // Scroll to bottom when keyboard appears
                if (flatListRef.current && messages.length > 0) {
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100); // Small delay to ensure layout is complete
                }
            }
        );

        const keyboardDidHideListener = Keyboard.addListener(
            "keyboardDidHide",
            () => {
                // Scroll to bottom when keyboard hides
                if (flatListRef.current && messages.length > 0) {
                    setTimeout(() => {
                        flatListRef.current?.scrollToEnd({ animated: true });
                    }, 100); // Small delay to ensure layout is complete
                }
            }
        );

        // Clean up listeners
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, [messages.length]);

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

        // Add user message to chat
        const userMessage = {
            id: `user-${Date.now()}-${Math.random()
                .toString(36)
                .substring(2, 11)}`,
            content: question,
            role: "user",
            timestamp: new Date().toISOString(),
        };
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
            const response = await askVideoQuestion(
                videoId,
                question,
                messages
            );

            // Check if response contains history with the AI's answer
            if (response.history && response.history.length > 0) {
                // The backend returns the full conversation history including the new AI response
                // The last message in the history array should be the AI's response
                const aiResponse =
                    response.history[response.history.length - 1];

                // Only add the AI response if it's not already in our messages
                // and it's from the model/assistant
                if (
                    aiResponse &&
                    (aiResponse.role === "model" ||
                        aiResponse.role === "assistant")
                ) {
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
                    setMessages((prev) => [...prev, aiMessage]);

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
                return;
            }

            // If speaking a different message, stop it first
            if (isPlayingTTS) {
                await stopSpeaking();
            }

            // Convert markdown to plain text for speech
            const plainText = parseMarkdownToPlainText(message.content);

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
        }
    };

    // Show analytics metrics
    const showAnalytics = () => {
        const metrics = analytics.getAnalyticsMetrics();

        Alert.alert(
            "Q&A Analytics Metrics",
            `Average Session Length: ${metrics.avgSessionLength.toFixed(
                2
            )} turns\n` +
                `"Cannot Answer" Rate: ${metrics.cannotAnswerRate.toFixed(
                    2
                )}%\n` +
                `Total Sessions: ${metrics.totalSessions}\n` +
                `Total Answers: ${metrics.totalAnswers}\n` +
                `"Cannot Answer" Count: ${metrics.cannotAnswerCount}\n` +
                `Average Response Time: ${(
                    metrics.avgResponseTime / 1000
                ).toFixed(2)} seconds`,
            [{ text: "OK", onPress: () => setShowAnalyticsModal(false) }]
        );

        setShowAnalyticsModal(true);
    };

    // Render message item
    const renderMessage = ({ item }) => {
        // Determine if this is a user message
        const isUserMessage = item.role === "user";

        return (
            <TouchableOpacity
                style={[
                    styles.messageContainer,
                    isUserMessage ? styles.userMessage : styles.aiMessage,
                    item.isOffline && styles.offlineMessage,
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
                                color={COLORS.error}
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
                                name={
                                    speakingMessageId === item.id &&
                                    isPlayingTTS
                                        ? "pause"
                                        : "volume-high"
                                }
                                size={18}
                                color={COLORS.primary}
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
            <ActivityIndicator size="small" color={COLORS.primary} />
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
                    color={COLORS.error}
                />
                <Text style={styles.errorMessage}>{error.message}</Text>
            </View>
            <TouchableOpacity
                style={styles.retryButton}
                onPress={retryLoadChatHistory}
                disabled={isRetrying}
            >
                {isRetrying ? (
                    <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                    <Text style={styles.retryButtonText}>Retry</Text>
                )}
            </TouchableOpacity>
        </View>
    );

    // If initial load, show loading screen
    if (isInitialLoad) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>
                    Loading conversation history...
                </Text>
            </View>
        );
    }

    // If no transcript available, show error screen with retry option
    if (!hasTranscript) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons
                    name="alert-circle-outline"
                    size={48}
                    color={COLORS.error}
                />
                <Text style={styles.errorText}>
                    This video does not have a transcript available.
                </Text>
                <Text style={styles.errorSubtext}>
                    The Q&A feature requires a video transcript to function.
                </Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={retryLoadChatHistory}
                >
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Video Info Header */}
            <View style={styles.videoInfoContainer}>
                <View style={styles.headerRow}>
                    <Image
                        source={{
                            uri:
                                videoThumbnail ||
                                "https://via.placeholder.com/480x360?text=No+Thumbnail",
                        }}
                        style={styles.thumbnail}
                    />
                    <TouchableOpacity
                        style={styles.analyticsButton}
                        onPress={showAnalytics}
                    >
                        <Ionicons
                            name="analytics-outline"
                            size={20}
                            color={COLORS.primary}
                        />
                        <Text style={styles.analyticsButtonText}>
                            Analytics
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.videoTitle} numberOfLines={2}>
                    {videoTitle}
                </Text>
            </View>

            {/* Messages List - Using FlatList directly instead of nesting in ScrollView */}
            <View style={styles.messagesContainer}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item, index) =>
                        item.id || `message-${index}-${Date.now()}`
                    }
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => {
                        console.log("Content size changed, scrolling to end");
                        flatListRef.current?.scrollToEnd();
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                Ask a question about the video content
                            </Text>
                            <Text style={styles.emptySubtext}>
                                The AI will answer based on the video transcript
                            </Text>
                        </View>
                    }
                    // Add keyboard aware behavior directly to FlatList
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    // Make sure the list can grow to fill available space
                    style={{ flex: 1 }}
                />

                {isLoading && renderLoading()}
                {error && renderError()}
            </View>

            {/* Input Container */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 80}
                style={styles.keyboardAvoidingContainer}
            >
                <View style={styles.inputContainer}>
                    {isOffline && (
                        <View style={styles.offlineBanner}>
                            <Ionicons
                                name="cloud-offline-outline"
                                size={16}
                                color={COLORS.error}
                            />
                            <Text style={styles.offlineBannerText}>
                                You're offline. Questions will be answered when
                                you're back online.
                            </Text>
                        </View>
                    )}
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type your question..."
                        placeholderTextColor={COLORS.textSecondary}
                        multiline
                        maxLength={500}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!inputText.trim() || isLoading) &&
                                styles.sendButtonDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={!inputText.trim() || isLoading}
                    >
                        <Ionicons
                            name="send"
                            size={24}
                            color={
                                !inputText.trim() || isLoading
                                    ? COLORS.disabled
                                    : COLORS.primary
                            }
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: SPACING.xl,
    },
    messagesContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    keyboardAvoidingContainer: {
        width: "100%",
        backgroundColor: COLORS.background,
    },
    videoInfoContainer: {
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: SPACING.sm,
    },
    thumbnail: {
        width: "80%",
        height: 100,
        borderRadius: 8,
    },
    analyticsButton: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: SPACING.sm,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginLeft: SPACING.sm,
    },
    analyticsButtonText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.primary,
        marginTop: SPACING.xs,
    },
    videoTitle: {
        fontSize: FONT_SIZES.md,
        fontWeight: "500",
        color: COLORS.text,
        textAlign: "center",
    },
    messageList: {
        padding: SPACING.md,
        flexGrow: 1,
    },
    messageContainer: {
        maxWidth: "80%",
        padding: SPACING.md,
        borderRadius: 16,
        marginBottom: SPACING.md,
        flexShrink: 1,
        flexDirection: "column",
    },
    userMessage: {
        alignSelf: "flex-end",
        backgroundColor: COLORS.primary,
    },
    aiMessage: {
        alignSelf: "flex-start",
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    messageContentContainer: {
        width: "100%",
        flexDirection: "column",
        flexShrink: 1,
    },
    messageText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        lineHeight: 20,
        flexShrink: 1,
        flexWrap: "wrap",
    },
    userMessageText: {
        color: COLORS.background,
    },
    messageFooter: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        width: "100%",
        marginTop: SPACING.xs,
    },
    timestamp: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginRight: SPACING.sm,
    },
    ttsButton: {
        padding: SPACING.xs,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        marginLeft: SPACING.xs,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        padding: SPACING.md,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.background,
        paddingBottom: Platform.OS === "ios" ? SPACING.xl : SPACING.lg, // Add extra padding at the bottom for iOS
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        marginRight: SPACING.sm,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        justifyContent: "center",
        alignItems: "center",
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: SPACING.sm,
        backgroundColor: COLORS.background,
    },
    loadingText: {
        marginLeft: SPACING.sm,
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: SPACING.xl,
        opacity: 0.8,
    },
    emptyText: {
        fontSize: FONT_SIZES.lg,
        color: COLORS.text,
        textAlign: "center",
        marginBottom: SPACING.sm,
    },
    emptySubtext: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
    errorText: {
        fontSize: FONT_SIZES.lg,
        color: COLORS.error,
        textAlign: "center",
        marginVertical: SPACING.md,
    },
    errorSubtext: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
    offlineMessage: {
        borderWidth: 1,
        borderColor: COLORS.error,
        opacity: 0.8,
    },
    offlineIndicator: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: SPACING.xs,
    },
    offlineText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.error,
        marginLeft: SPACING.xs,
    },
    offlineBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.error + "20", // 20% opacity
        padding: SPACING.xs,
        borderRadius: 8,
        marginBottom: SPACING.xs,
        width: "100%",
    },
    offlineBannerText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.error,
        marginLeft: SPACING.xs,
        flex: 1,
    },
    errorBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.error + "20", // 20% opacity
        padding: SPACING.sm,
        borderRadius: 8,
        margin: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.error,
    },
    errorContent: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    errorMessage: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.error,
        marginLeft: SPACING.xs,
        flex: 1,
    },
    retryButton: {
        backgroundColor: COLORS.error,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: 4,
        marginLeft: SPACING.sm,
    },
    retryButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.sm,
        fontWeight: "500",
    },
});

// Define markdown styles
const markdownStyles = {
    body: {
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
        lineHeight: 20,
        flexWrap: "wrap",
        flexShrink: 1,
        width: "100%",
    },
    heading1: {
        fontSize: FONT_SIZES.xl,
        fontWeight: "bold",
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
        color: COLORS.text,
        flexWrap: "wrap",
    },
    heading2: {
        fontSize: FONT_SIZES.lg,
        fontWeight: "bold",
        marginTop: SPACING.md,
        marginBottom: SPACING.sm,
        color: COLORS.text,
        flexWrap: "wrap",
    },
    heading3: {
        fontSize: FONT_SIZES.md + 2,
        fontWeight: "bold",
        marginTop: SPACING.sm,
        marginBottom: SPACING.xs,
        color: COLORS.text,
        flexWrap: "wrap",
    },
    paragraph: {
        marginBottom: SPACING.sm,
        color: COLORS.text,
        flexWrap: "wrap",
    },
    link: {
        color: COLORS.primary,
        textDecorationLine: "underline",
        flexWrap: "wrap",
        overflow: "hidden",
    },
    url: {
        color: COLORS.primary,
        textDecorationLine: "underline",
        flexWrap: "wrap",
        overflow: "hidden",
    },
    code_inline: {
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        backgroundColor: COLORS.border + "40",
        borderRadius: 4,
        paddingHorizontal: 4,
        flexWrap: "wrap",
        overflow: "hidden",
    },
    code_block: {
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        backgroundColor: COLORS.border + "40",
        borderRadius: 4,
        padding: SPACING.sm,
        marginVertical: SPACING.sm,
        flexWrap: "wrap",
        width: "100%",
        overflow: "hidden",
    },
    fence: {
        fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
        backgroundColor: COLORS.border + "40",
        borderRadius: 4,
        padding: SPACING.sm,
        marginVertical: SPACING.sm,
        flexWrap: "wrap",
        width: "100%",
        overflow: "hidden",
    },
    blockquote: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.border,
        paddingLeft: SPACING.md,
        flexWrap: "wrap",
        marginLeft: SPACING.sm,
        marginVertical: SPACING.sm,
        opacity: 0.8,
    },
    code_block: {
        backgroundColor: COLORS.surface,
        padding: SPACING.sm,
        borderRadius: 4,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: FONT_SIZES.sm,
    },
    code_inline: {
        backgroundColor: COLORS.surface,
        padding: 2,
        borderRadius: 2,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        fontSize: FONT_SIZES.sm,
    },
    list_item: {
        flexDirection: "row",
        marginBottom: SPACING.xs,
    },
    bullet_list: {
        marginBottom: SPACING.sm,
    },
    ordered_list: {
        marginBottom: SPACING.sm,
    },
    hr: {
        backgroundColor: COLORS.border,
        height: 1,
        marginVertical: SPACING.md,
    },
    table: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 4,
        marginVertical: SPACING.md,
    },
    tr: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: COLORS.border,
    },
    th: {
        padding: SPACING.sm,
        fontWeight: "bold",
        backgroundColor: COLORS.surface,
    },
    td: {
        padding: SPACING.sm,
    },
};

export default QAScreen;
