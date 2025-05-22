import React, { useState, useEffect, useRef } from "react";
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    Alert,
    Share,
    SafeAreaView,
} from "react-native";
import { useTimeZone } from "../context/TimeZoneContext";
import { useTheme } from "../context/ThemeContext";
import useThemedStyles from "../hooks/useThemedStyles";

// Import components, services, and utilities
import {
    updateSummary,
    regenerateSummary,
    toggleStarSummary,
    getVideoSummaries,
    generateSummary,
} from "../services/api";
import {
    speakText,
    stopSpeaking,
    isSpeaking,
    setSpeechCallbacks,
    clearSpeechCallbacks,
    processTextForSpeech,
} from "../services/tts";
import {
    truncateText,
    copyToClipboard,
    openUrl,
    formatSummaryType,
    formatSummaryLength,
    parseMarkdownToPlainText,
} from "../utils";
import {
    SPACING,
    SUMMARY_TYPES,
    SUMMARY_LENGTHS,
    FONT_SIZES,
} from "../constants";

// Import modular components
import {
    VideoInfo,
    SummaryInfo,
    SummaryContent,
    ActionButtons,
    OtherSummaries,
    TTSNavigation,
    EditModal,
    LoadingOverlay,
} from "../components/summary";

const SummaryScreen = ({ route, navigation }) => {
    // Get summary from route params
    const { summary } = route.params || {};

    // Get time zone context and theme
    const { formatDateWithTimeZone } = useTimeZone();
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        scrollContent: {
            padding: SPACING.md,
        },
        errorContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: SPACING.lg,
        },
        errorText: {
            fontSize: FONT_SIZES.lg,
            color: colors.error,
            textAlign: "center",
        },
    }));

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [showPlainText, setShowPlainText] = useState(false);
    const [selectedType, setSelectedType] = useState(
        summary?.summary_type || SUMMARY_TYPES[0].id
    );
    const [selectedLength, setSelectedLength] = useState(
        summary?.summary_length || SUMMARY_LENGTHS[1].id
    );
    const [otherSummaries, setOtherSummaries] = useState([]);
    const [loadingOtherSummaries, setLoadingOtherSummaries] = useState(false);
    const [showOtherSummaries, setShowOtherSummaries] = useState(false);
    const [generationStartTime, setGenerationStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const timerRef = useRef(null);

    // TTS highlighting state
    const [currentWord, setCurrentWord] = useState(null);
    const [currentSentence, setCurrentSentence] = useState(0);
    const [processedText, setProcessedText] = useState(null);

    // Refs
    const scrollViewRef = useRef(null);
    const summaryContentRef = useRef(null);

    // Handle generation time tracking
    useEffect(() => {
        if (isLoading && generationStartTime) {
            timerRef.current = setInterval(() => {
                setElapsedTime(
                    Math.floor((Date.now() - generationStartTime) / 1000)
                );
            }, 1000);
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isLoading, generationStartTime]);

    // Handle cancel regeneration
    let handleCancel = () => {
        // Immediately set loading to false to prevent further UI updates
        setIsLoading(false);
        setGenerationStartTime(null);
        setElapsedTime(0);
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    // Set navigation title
    useEffect(() => {
        navigation.setOptions({
            title: truncateText(summary?.video_title || "Summary", 30),
        });
    }, [navigation, summary]);

    // Fetch other summaries for the same video
    useEffect(() => {
        const fetchOtherSummaries = async () => {
            if (!summary?.video_url) return;

            setLoadingOtherSummaries(true);
            try {
                const response = await getVideoSummaries(summary.video_url);
                // Filter out the current summary
                const filteredSummaries = response.summaries.filter(
                    (s) => s.id !== summary.id
                );
                setOtherSummaries(filteredSummaries);
            } catch (error) {
                console.error("Error fetching other summaries:", error);
            } finally {
                setLoadingOtherSummaries(false);
            }
        };

        fetchOtherSummaries();
    }, [summary?.video_url, summary?.id]);

    // Check if TTS is playing
    useEffect(() => {
        const checkSpeakingStatus = async () => {
            const speaking = await isSpeaking();
            setIsPlaying(speaking);
        };

        const interval = setInterval(checkSpeakingStatus, 1000);
        return () => clearInterval(interval);
    }, []);

    // Process text for TTS when summary changes
    useEffect(() => {
        if (summary?.summary_text) {
            // Parse markdown to plain text for TTS processing
            const plainText = parseMarkdownToPlainText(summary.summary_text);
            const processed = processTextForSpeech(plainText);
            setProcessedText(processed);

            // Reset to the beginning of the summary when summary changes
            setCurrentSentence(0);
            setCurrentWord(null);
        }
    }, [summary]);

    // Setup speech callbacks
    useEffect(() => {
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
                // When starting from the Read Aloud button, we want to start from the beginning
                // The sentenceIndex parameter will be 0 when starting from the beginning
                setCurrentSentence(sentenceIndex);
                // Reset current word when starting speech
                setCurrentWord(null);
            },
            onDone: () => {
                setCurrentWord(null);
                setIsPlaying(false);
            },
            onStopped: () => {
                setCurrentWord(null);
                setIsPlaying(false);
            },
        });

        // Clean up when component unmounts
        return () => {
            stopSpeaking();
            clearSpeechCallbacks();
        };
    }, []);

    // Scroll to the current word being spoken
    useEffect(() => {
        if (
            currentWord &&
            scrollViewRef.current &&
            summaryContentRef.current &&
            summaryContentRef.current.sentenceRefs[currentWord.sentenceIndex]
        ) {
            // Get the sentence ref and measure its position
            summaryContentRef.current.sentenceRefs[
                currentWord.sentenceIndex
            ].measureLayout(
                scrollViewRef.current,
                (_, y) => {
                    // Scroll to the position
                    scrollViewRef.current.scrollTo({
                        y: y,
                        animated: true,
                    });
                },
                () => console.log("Measurement failed")
            );
        }
    }, [currentWord]);

    // Handle play/pause
    const handlePlayPause = async () => {
        if (isPlaying) {
            await stopSpeaking();
            setIsPlaying(false);
        } else {
            // Use plain text for speech
            const plainText = parseMarkdownToPlainText(summary.summary_text);
            // Always start from the beginning (sentence index 0) when pressing Read Aloud
            setCurrentSentence(0); // Reset to first sentence
            const success = await speakText(plainText, 0); // Always start from the beginning
            setIsPlaying(success);
        }
    };

    // Handle next sentence
    const handleNextSentence = async () => {
        if (
            processedText &&
            currentSentence < processedText.sentences.length - 1
        ) {
            const nextSentence = currentSentence + 1;
            await stopSpeaking();
            // Use plain text for speech
            const plainText = parseMarkdownToPlainText(summary.summary_text);
            const success = await speakText(plainText, nextSentence);
            setIsPlaying(success);
        }
    };

    // Handle previous sentence
    const handlePrevSentence = async () => {
        if (processedText && currentSentence > 0) {
            const prevSentence = currentSentence - 1;
            await stopSpeaking();
            // Use plain text for speech
            const plainText = parseMarkdownToPlainText(summary.summary_text);
            const success = await speakText(plainText, prevSentence);
            setIsPlaying(success);
        }
    };

    // Handle sentence tap (double-tap gesture)
    const handleSentenceTap = async (sentenceIndex) => {
        try {
            console.log(
                `Double-tap detected on sentence index: ${sentenceIndex}`
            );

            // Validate inputs
            if (!processedText || !summary?.summary_text) {
                console.warn(
                    "Cannot start TTS: Missing processed text or summary text"
                );
                return;
            }

            // Ensure sentence index is valid
            const sentenceCount = processedText.sentences?.length || 0;
            console.log(`Total sentences: ${sentenceCount}`);

            if (sentenceIndex < 0 || sentenceIndex >= sentenceCount) {
                console.warn(
                    `Invalid sentence index: ${sentenceIndex}. Valid range: 0-${
                        sentenceCount - 1
                    }`
                );
                // Default to first sentence if index is invalid
                sentenceIndex = 0;
            }

            // Log the sentence content for debugging
            if (processedText.sentences[sentenceIndex]) {
                console.log(
                    `Starting TTS from sentence: "${processedText.sentences[sentenceIndex].text}"`
                );
            }

            // Stop any ongoing speech
            await stopSpeaking();

            // Update the current sentence
            setCurrentSentence(sentenceIndex);

            // Use plain text for speech
            const plainText = parseMarkdownToPlainText(summary.summary_text);

            // Start speaking from the tapped sentence
            console.log(
                `Calling speakText with sentenceIndex: ${sentenceIndex}`
            );
            const success = await speakText(plainText, sentenceIndex);
            console.log(`TTS started successfully: ${success}`);

            setIsPlaying(success);
        } catch (error) {
            console.error("Error handling sentence tap:", error);
            // Gracefully handle the error
            setIsPlaying(false);
        }
    };

    // Handle share
    const handleShare = async () => {
        try {
            await Share.share({
                message: `Summary for "${summary.video_title}":\n\n${summary.summary_text}\n\nOriginal Video: ${summary.video_url}`,
            });
        } catch (error) {
            console.error("Error sharing summary:", error);
            Alert.alert("Error", "Failed to share summary.");
        }
    };

    // Handle copy
    const handleCopy = async () => {
        const success = await copyToClipboard(summary.summary_text);
        if (success) {
            Alert.alert("Success", "Summary copied to clipboard.");
        } else {
            Alert.alert("Error", "Failed to copy summary to clipboard.");
        }
    };

    // Handle open original video
    const handleOpenVideo = async () => {
        await openUrl(summary.video_url);
    };

    // Handle edit
    const handleEdit = () => {
        setSelectedType(summary.summary_type);
        setSelectedLength(summary.summary_length);
        setEditModalVisible(true);
    };

    // Handle navigation to another summary
    const handleNavigateToSummary = (otherSummary) => {
        // Stop TTS if playing
        if (isPlaying) {
            stopSpeaking();
            setIsPlaying(false);
        }

        // Navigate to the selected summary
        navigation.setParams({ summary: otherSummary });
    };

    // Handle star toggle
    const handleToggleStar = async () => {
        try {
            const newStarredStatus = !summary.is_starred;
            const updatedSummary = await toggleStarSummary(
                summary.id,
                newStarredStatus
            );

            // Update the route params with the updated summary
            navigation.setParams({ summary: updatedSummary });
        } catch (error) {
            console.error("Error toggling star status:", error);
            Alert.alert(
                "Error",
                "Failed to update star status. Please try again."
            );
        }
    };

    // Handle toggle text format
    const handleToggleTextFormat = () => {
        // If TTS is playing, stop it
        if (isPlaying) {
            stopSpeaking();
            setIsPlaying(false);
        }
        setShowPlainText(!showPlainText);
    };

    // Handle save edit - creates a new summary with the selected type and length
    const handleSaveEdit = async () => {
        if (
            selectedType === summary.summary_type &&
            selectedLength === summary.summary_length
        ) {
            setEditModalVisible(false);
            return;
        }

        // First, check if a summary with the selected type and length already exists
        try {
            // Fetch the latest summaries for this video to ensure we have the most up-to-date list
            const response = await getVideoSummaries(summary.video_url);
            const allSummaries = response.summaries;

            // Look for an existing summary with the same type and length
            const existingSummary = allSummaries.find(
                (s) =>
                    s.summary_type === selectedType &&
                    s.summary_length === selectedLength
            );

            if (existingSummary) {
                // A summary with these parameters already exists
                setEditModalVisible(false);

                // Silently navigate to the existing summary without showing an alert
                handleNavigateToSummary(existingSummary);
                return;
            }
        } catch (error) {
            console.error("Error checking for existing summaries:", error);
            // Continue with summary generation even if the check fails
        }

        // Create an abort controller for cancellation
        const abortController = new AbortController();

        // Use a local variable for accurate time tracking
        const startTime = Date.now();
        setIsLoading(true);
        setGenerationStartTime(startTime); // Update state for UI timer

        // Store the abort controller in a ref for the cancel button
        const cancelRef = {
            abort: () => {
                abortController.abort();
                setIsLoading(false);
                setGenerationStartTime(null);
                setElapsedTime(0);
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            },
        };

        // Update the cancel button handler
        const originalCancelHandler = handleCancel;
        handleCancel = () => {
            cancelRef.abort();
            originalCancelHandler();
        };

        try {
            // Use generateSummary to create a new summary instead of updating the existing one
            const newSummary = await generateSummary(
                summary.video_url,
                selectedType,
                selectedLength,
                abortController.signal
            );

            // If loading was cancelled, don't update UI
            if (!isLoading) return;

            // Calculate the elapsed time using the local variable for accuracy
            const timeTaken = Math.floor((Date.now() - startTime) / 1000);
            newSummary.timeTaken = timeTaken > 0 ? timeTaken : 1; // Ensure at least 1 second is shown

            // Refresh other summaries list
            const response = await getVideoSummaries(summary.video_url);
            const filteredSummaries = response.summaries.filter(
                (s) => s.id !== newSummary.id
            );
            setOtherSummaries(filteredSummaries);

            // Automatically show and highlight the other summaries section
            if (filteredSummaries.length > 0) {
                setShowOtherSummaries(true);
            }

            // Update the route params with the new summary
            navigation.setParams({ summary: newSummary });
        } catch (error) {
            // Don't show error if it was cancelled
            if (error.name === "AbortError" || !isLoading) return;

            console.error("Error creating new summary:", error);

            Alert.alert(
                "Error",
                error.response?.data?.detail || "Failed to create new summary."
            );
        } finally {
            // Restore original cancel handler
            handleCancel = originalCancelHandler;

            // Close the modal if we're still in loading state (i.e., the generation wasn't cancelled by user)
            if (isLoading) {
                setEditModalVisible(false);
            }

            setIsLoading(false);
            setGenerationStartTime(null);
            setElapsedTime(0);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    // Handle regenerate summary - regenerates the summary with the same parameters
    const handleRegenerateSummary = async () => {
        // Create an abort controller for cancellation
        const abortController = new AbortController();

        // Use a local variable for accurate time tracking
        const startTime = Date.now();
        setIsLoading(true);
        setGenerationStartTime(startTime); // Update state for UI timer

        // Store the abort controller in a ref for the cancel button
        const cancelRef = {
            abort: () => {
                abortController.abort();
                setIsLoading(false);
                setGenerationStartTime(null);
                setElapsedTime(0);
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            },
        };

        // Update the cancel button handler
        const originalCancelHandler = handleCancel;
        handleCancel = () => {
            cancelRef.abort();
            originalCancelHandler();
        };

        try {
            const newSummary = await regenerateSummary(summary.id);

            // If loading was cancelled, don't update UI
            if (!isLoading) return;

            // Calculate the elapsed time using the local variable for accuracy
            const timeTaken = Math.floor((Date.now() - startTime) / 1000);
            newSummary.timeTaken = timeTaken > 0 ? timeTaken : 1; // Ensure at least 1 second is shown

            // Update the route params with the new summary
            navigation.setParams({ summary: newSummary });

            // Refresh other summaries list
            const response = await getVideoSummaries(summary.video_url);
            const filteredSummaries = response.summaries.filter(
                (s) => s.id !== newSummary.id
            );
            setOtherSummaries(filteredSummaries);

            // Show success message
            Alert.alert(
                "Success",
                "Summary has been regenerated successfully."
            );
        } catch (error) {
            // Don't show error if it was cancelled
            if (error.name === "AbortError" || !isLoading) return;

            console.error("Error regenerating summary:", error);
            Alert.alert(
                "Error",
                error.response?.data?.detail ||
                    "Failed to regenerate summary. Please try again."
            );
        } finally {
            // Restore original cancel handler
            handleCancel = originalCancelHandler;

            setIsLoading(false);
            setGenerationStartTime(null);
            setElapsedTime(0);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    // If no summary, show error
    if (!summary) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Summary not found.</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Edit Modal */}
            <EditModal
                visible={editModalVisible}
                selectedType={selectedType}
                selectedLength={selectedLength}
                isLoading={isLoading}
                elapsedTime={elapsedTime}
                onClose={() => setEditModalVisible(false)}
                onSave={handleSaveEdit}
                onCancel={handleCancel}
                onTypeChange={setSelectedType}
                onLengthChange={setSelectedLength}
            />

            {/* Loading Overlay */}
            <LoadingOverlay
                visible={isLoading && !editModalVisible}
                elapsedTime={elapsedTime}
                onCancel={handleCancel}
            />

            <ScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Video Info */}
                <VideoInfo
                    videoTitle={summary.video_title}
                    videoThumbnailUrl={summary.video_thumbnail_url}
                    videoUrl={summary.video_url}
                    onOpenVideo={handleOpenVideo}
                />

                {/* Summary Info */}
                <SummaryInfo
                    summaryType={summary.summary_type}
                    summaryLength={summary.summary_length}
                    createdAt={summary.created_at}
                    timeTaken={summary.timeTaken}
                    formatSummaryType={formatSummaryType}
                    formatSummaryLength={formatSummaryLength}
                    formatDateWithTimeZone={formatDateWithTimeZone}
                />

                {/* Summary Content */}
                <SummaryContent
                    ref={summaryContentRef}
                    summaryText={summary.summary_text}
                    isPlaying={isPlaying}
                    showPlainText={showPlainText}
                    processedText={processedText}
                    currentSentence={currentSentence}
                    currentWord={currentWord}
                    scrollViewRef={scrollViewRef}
                    onSentenceTap={handleSentenceTap}
                />

                {/* Other Summaries */}
                <OtherSummaries
                    summaries={otherSummaries}
                    isLoading={loadingOtherSummaries}
                    onNavigateToSummary={handleNavigateToSummary}
                    formatDateWithTimeZone={formatDateWithTimeZone}
                    initiallyExpanded={showOtherSummaries}
                />
            </ScrollView>

            {/* TTS Navigation */}
            <TTSNavigation
                visible={isPlaying && !showPlainText}
                currentSentence={currentSentence}
                processedText={processedText}
                onPrevSentence={handlePrevSentence}
                onNextSentence={handleNextSentence}
            />

            {/* Action Buttons */}
            <ActionButtons
                isPlaying={isPlaying}
                showPlainText={showPlainText}
                isLoading={isLoading}
                isStarred={summary.is_starred}
                onPlayPause={handlePlayPause}
                onToggleTextFormat={handleToggleTextFormat}
                onShare={handleShare}
                onCopy={handleCopy}
                onToggleStar={handleToggleStar}
                onRegenerate={handleRegenerateSummary}
                onNewType={handleEdit}
                onAskAI={() => navigation.navigate("QA", { summary })}
            />
        </SafeAreaView>
    );
};

export default SummaryScreen;
