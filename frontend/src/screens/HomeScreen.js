import React, { useState, useEffect, useRef } from "react";
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";

// Import components, services, and utilities
import { generateSummary } from "../services/api";
import {
    COLORS,
    SPACING,
    FONT_SIZES,
    SUMMARY_TYPES,
    SUMMARY_LENGTHS,
    SCREENS,
} from "../constants";

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

    // Render summary type options
    const renderSummaryTypeOptions = () => {
        return (
            <View style={styles.optionsContainer}>
                <Text style={styles.optionsLabel}>Summary Type:</Text>
                <View style={styles.optionsButtonGroup}>
                    {SUMMARY_TYPES.map((type) => (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.optionButton,
                                summaryType === type.id &&
                                    styles.optionButtonSelected,
                            ]}
                            onPress={() => setSummaryType(type.id)}
                        >
                            <Text
                                style={[
                                    styles.optionButtonText,
                                    summaryType === type.id &&
                                        styles.optionButtonTextSelected,
                                ]}
                            >
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    // Render summary length options
    const renderSummaryLengthOptions = () => {
        return (
            <View style={styles.optionsContainer}>
                <Text style={styles.optionsLabel}>Summary Length:</Text>
                <View style={styles.optionsButtonGroup}>
                    {SUMMARY_LENGTHS.map((length) => (
                        <TouchableOpacity
                            key={length.id}
                            style={[
                                styles.optionButton,
                                summaryLength === length.id &&
                                    styles.optionButtonSelected,
                            ]}
                            onPress={() => setSummaryLength(length.id)}
                        >
                            <Text
                                style={[
                                    styles.optionButtonText,
                                    summaryLength === length.id &&
                                        styles.optionButtonTextSelected,
                                ]}
                            >
                                {length.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

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
                    <View style={styles.header}>
                        <Text style={styles.title}>YouTube Summarizer</Text>
                        <Text style={styles.subtitle}>
                            Get AI-powered summaries of YouTube videos
                        </Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[
                                    styles.input,
                                    !isValidUrl && styles.inputError,
                                ]}
                                placeholder="Paste YouTube URL here"
                                value={url}
                                onChangeText={handleUrlChange}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                            />
                            <TouchableOpacity
                                style={styles.pasteButton}
                                onPress={handlePasteFromClipboard}
                                accessibilityLabel="Paste from clipboard"
                                accessibilityHint="Pastes YouTube URL from clipboard"
                            >
                                <Ionicons
                                    name="clipboard-outline"
                                    size={24}
                                    color={COLORS.primary}
                                />
                            </TouchableOpacity>
                        </View>
                        {!isValidUrl && (
                            <Text style={styles.errorText}>
                                Please enter a valid YouTube URL
                            </Text>
                        )}
                    </View>

                    {renderSummaryTypeOptions()}
                    {renderSummaryLengthOptions()}

                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <View style={styles.loadingInfo}>
                                <ActivityIndicator
                                    color={COLORS.primary}
                                    size="small"
                                />
                                <Text style={styles.loadingText}>
                                    Generating summary... {elapsedTime}s
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancelSummary}
                            >
                                <Ionicons
                                    name="close-circle"
                                    size={20}
                                    color={COLORS.error}
                                />
                                <Text style={styles.cancelButtonText}>
                                    Stop
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleSubmit}
                        >
                            <Ionicons
                                name="document-text"
                                size={20}
                                color={COLORS.background}
                            />
                            <Text style={styles.buttonText}>
                                Generate Summary
                            </Text>
                        </TouchableOpacity>
                    )}
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
    header: {
        marginTop: SPACING.xl,
        marginBottom: SPACING.xl,
        alignItems: "center",
    },
    title: {
        fontSize: FONT_SIZES.xxxl,
        fontWeight: "bold",
        color: COLORS.primary,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
    inputContainer: {
        marginBottom: SPACING.lg,
    },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    input: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        paddingHorizontal: SPACING.md,
        fontSize: FONT_SIZES.md,
        backgroundColor: COLORS.surface,
        color: COLORS.text,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    pasteButton: {
        padding: SPACING.sm,
        marginLeft: SPACING.sm,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        height: 50,
        width: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    errorText: {
        color: COLORS.error,
        fontSize: FONT_SIZES.sm,
        marginTop: SPACING.xs,
    },
    optionsContainer: {
        marginBottom: SPACING.lg,
    },
    optionsLabel: {
        fontSize: FONT_SIZES.md,
        fontWeight: "500",
        marginBottom: SPACING.sm,
        color: COLORS.text,
    },
    optionsButtonGroup: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    optionButton: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: SPACING.sm,
        marginBottom: SPACING.sm,
        backgroundColor: COLORS.surface,
    },
    optionButtonSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    optionButtonText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.text,
    },
    optionButtonTextSelected: {
        color: COLORS.background,
    },
    button: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: SPACING.md,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: SPACING.md,
    },
    buttonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.md,
        fontWeight: "600",
        marginLeft: SPACING.sm,
    },
    loadingContainer: {
        marginTop: SPACING.md,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
        padding: SPACING.md,
    },
    loadingInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: SPACING.md,
    },
    loadingText: {
        marginLeft: SPACING.md,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
    },
    cancelButton: {
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.error,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    cancelButtonText: {
        color: COLORS.error,
        fontSize: FONT_SIZES.md,
        fontWeight: "600",
        marginLeft: SPACING.sm,
    },
});

export default HomeScreen;
