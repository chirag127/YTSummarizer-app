import React, { useState, useEffect, useRef } from "react";
import {
    StyleSheet,
    View,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";

// Import components, services, and utilities
import { generateSummary } from "../services/api";
import {
    COLORS,
    SPACING,
    SUMMARY_TYPES,
    SUMMARY_LENGTHS,
    SCREENS,
} from "../constants";

// Import home components
import {
    HomeHeader,
    VideoInput,
    SummaryTypeSelector,
    SummaryLengthSelector,
    ActionButtons,
} from "../components/home";

// Constants
const LAST_SETTINGS_KEY = "last_summary_settings";

const HomeScreen = ({ navigation, route }) => {
    // State
    const [url, setUrl] = useState("");
    const [isValidUrl, setIsValidUrl] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [summaryType, setSummaryType] = useState(SUMMARY_TYPES[0].id);
    const [summaryLength, setSummaryLength] = useState(SUMMARY_LENGTHS[1].id);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Refs
    const timerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const startTimeRef = useRef(null); // Add ref for tracking start time

    // Function to handle shared text (URLs)
    const handleSharedText = async () => {
        try {
            // Check if app was opened from a share intent
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
                console.log("App opened from URL:", initialUrl);
                setUrl(initialUrl);

                // Enhanced YouTube URL detection
                const isYouTubeUrl =
                    initialUrl.includes("youtube.com/watch") ||
                    initialUrl.includes("youtu.be/") ||
                    initialUrl.includes("m.youtube.com/watch") ||
                    initialUrl.includes("youtube.com/v/") ||
                    initialUrl.includes("youtube.com/embed/") ||
                    initialUrl.includes("youtube.app.goo.gl") ||
                    initialUrl.includes("youtube.com/live/") ||
                    initialUrl.includes("m.youtube.com/live/");

                // Process the URL immediately if it's a YouTube URL
                if (isYouTubeUrl) {
                    console.log(
                        "Auto-processing YouTube URL from initialUrl:",
                        initialUrl
                    );
                    // Use a timeout to ensure state is updated
                    setTimeout(() => {
                        processUrl(initialUrl);
                    }, 300); // Reduced timeout for faster processing
                }
            }

            // For Android and iOS, we rely on the intent filters and URL schemes
            // defined in app.json to handle shared content
            console.log(
                "Using Expo's built-in URL handling for shared content in HomeScreen"
            );
        } catch (error) {
            console.error("Error handling shared text:", error);
        }
    };

    // Function to handle cancellation of summary generation
    const handleCancelSummary = () => {
        // Cancel the ongoing API request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // Stop the timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setIsLoading(false);
        setElapsedTime(0);
        startTimeRef.current = null; // Reset start time ref
    };

    // Helper function to process a URL directly
    const processUrl = React.useCallback(
        async (urlToProcess) => {
            if (!urlToProcess || !urlToProcess.trim()) {
                return;
            }

            // Reset timer and start loading
            setElapsedTime(0);
            setIsLoading(true);

            // Create a new AbortController
            abortControllerRef.current = new AbortController();

            // Start the timer using the ref for consistent access
            startTimeRef.current = Date.now();
            timerRef.current = setInterval(() => {
                const currentTime = Date.now();
                const elapsed = Math.floor(
                    (currentTime - startTimeRef.current) / 1000
                );
                setElapsedTime(elapsed);
            }, 1000);

            try {
                console.log("Processing URL directly:", urlToProcess);

                // Process URL without showing alert popup
                const summary = await generateSummary(
                    urlToProcess,
                    summaryType,
                    summaryLength,
                    abortControllerRef.current.signal
                );

                // Calculate the elapsed time using the ref for accuracy
                const timeTaken = Math.floor(
                    (Date.now() - startTimeRef.current) / 1000
                );
                summary.timeTaken = timeTaken > 0 ? timeTaken : 1; // Ensure at least 1 second is shown

                navigation.navigate(SCREENS.SUMMARY, { summary });
            } catch (error) {
                console.error("Error processing URL:", error);

                // Only show alert if not aborted by user
                if (error.name !== "AbortError") {
                    Alert.alert(
                        "Error",
                        "Failed to process the URL. Please try again."
                    );
                }
            } finally {
                // Clean up timer
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }

                setIsLoading(false);
                abortControllerRef.current = null;
                startTimeRef.current = null; // Reset start time ref
            }
        },
        [summaryType, summaryLength, navigation]
    );

    // Load last used settings and check for shared content
    useEffect(() => {
        const loadLastSettings = async () => {
            try {
                const settingsString = await AsyncStorage.getItem(
                    LAST_SETTINGS_KEY
                );
                if (settingsString) {
                    const settings = JSON.parse(settingsString);
                    setSummaryType(settings.type || SUMMARY_TYPES[0].id);
                    setSummaryLength(settings.length || SUMMARY_LENGTHS[1].id);
                }
            } catch (error) {
                console.error("Error loading last settings:", error);
            }
        };

        loadLastSettings();
        handleSharedText(); // Check for shared content when component mounts

        // No cleanup needed for Expo's URL handling
        return () => {};
    }, []);

    // Save settings when changed
    useEffect(() => {
        const saveSettings = async () => {
            try {
                await AsyncStorage.setItem(
                    LAST_SETTINGS_KEY,
                    JSON.stringify({ type: summaryType, length: summaryLength })
                );
            } catch (error) {
                console.error("Error saving settings:", error);
            }
        };

        saveSettings();
    }, [summaryType, summaryLength]);

    // Handle URL input change
    const handleUrlChange = (text) => {
        setUrl(text);
        setIsValidUrl(true); // Reset validation on change
    };

    // Handle clipboard paste
    const handlePasteFromClipboard = async () => {
        try {
            const clipboardContent = await Clipboard.getStringAsync();
            if (clipboardContent) {
                setUrl(clipboardContent);
                setIsValidUrl(true);
            }
        } catch (error) {
            console.error("Error pasting from clipboard:", error);
            Alert.alert("Error", "Failed to paste from clipboard");
        }
    };

    // Handle URL submission from the UI
    const handleSubmit = () => {
        // Basic validation - just check if URL is not empty
        if (!url.trim()) {
            setIsValidUrl(false);
            return;
        }

        // Use the common processUrl function
        processUrl(url);
    };

    // Handle shared URLs from navigation params
    useEffect(() => {
        // Check if we have a shared URL from navigation params
        if (route.params?.sharedUrl) {
            const sharedUrl = route.params.sharedUrl;
            const timestamp = route.params.timestamp || 0; // Get timestamp if available
            const autoProcess = route.params.autoProcess || false; // Check if auto-processing is requested

            console.log(
                "Received shared URL in HomeScreen:",
                sharedUrl,
                "Timestamp:",
                timestamp,
                "Auto Process:",
                autoProcess
            );

            // Set the URL in the input field
            setUrl(sharedUrl);

            // Always auto-process shared URLs as per the requirement
            const timer = setTimeout(() => {
                console.log(
                    "Auto-processing shared URL in HomeScreen:",
                    sharedUrl
                );
                if (sharedUrl) {
                    // Process the URL directly without relying on state
                    processUrl(sharedUrl);
                }
            }, 300); // Reduced delay for faster processing while ensuring state is updated

            return () => clearTimeout(timer);
        }
    }, [
        route.params?.sharedUrl,
        route.params?.timestamp,
        route.params?.autoProcess,
        processUrl,
    ]);

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
            >
                <StatusBar style="auto" />
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    <HomeHeader />

                    <VideoInput
                        url={url}
                        isValidUrl={isValidUrl}
                        onUrlChange={handleUrlChange}
                        onPasteFromClipboard={handlePasteFromClipboard}
                    />

                    <SummaryTypeSelector
                        summaryType={summaryType}
                        onSummaryTypeChange={setSummaryType}
                    />

                    <SummaryLengthSelector
                        summaryLength={summaryLength}
                        onSummaryLengthChange={setSummaryLength}
                    />

                    <ActionButtons
                        isLoading={isLoading}
                        elapsedTime={elapsedTime}
                        onSubmit={handleSubmit}
                        onCancel={handleCancelSummary}
                    />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: SPACING.lg,
    },
});

export default HomeScreen;
