import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    StyleSheet,
    View,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    Linking,
    Text,
    TouchableOpacity,
    ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

// Import components, services, and utilities
import { generateSummary } from "../services/api";
import queueService from "../services/queueService";
import {
    SPACING,
    SUMMARY_TYPES,
    SUMMARY_LENGTHS,
    SCREENS,
    FONT_SIZES,
} from "../constants";
import { useTheme } from "../context/ThemeContext";
import useThemedStyles from "../hooks/useThemedStyles";

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
    // Get theme colors
    const { colors } = useTheme();

    // State
    const [url, setUrl] = useState("");
    const [isValidUrl, setIsValidUrl] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [summaryType, setSummaryType] = useState(SUMMARY_TYPES[0].id);
    const [summaryLength, setSummaryLength] = useState(SUMMARY_LENGTHS[1].id);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [queueCount, setQueueCount] = useState(0); // Add queue count state

    // Refs
    const timerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const startTimeRef = useRef(null);

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        scrollContent: {
            flexGrow: 1,
            padding: SPACING.lg,
        },
        queueIndicator: {
            backgroundColor: `${colors.primary}20`, // 20% opacity
            padding: SPACING.sm,
            borderRadius: 8,
            marginBottom: SPACING.md,
            alignItems: "center",
        },
        queueText: {
            color: colors.primary,
            fontSize: FONT_SIZES.md,
            fontWeight: "600",
        },
        addAnotherButton: {
            backgroundColor: colors.surface,
            padding: SPACING.md,
            borderRadius: 8,
            marginBottom: SPACING.md,
            borderWidth: 1,
            borderColor: colors.primary,
        },
        addAnotherContent: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: SPACING.sm,
        },
        addAnotherText: {
            color: colors.primary,
            fontSize: FONT_SIZES.md,
            fontWeight: "600",
        },
        loadingIndicator: {
            alignItems: "center",
            marginBottom: SPACING.lg,
            padding: SPACING.md,
            backgroundColor: colors.surface,
            borderRadius: 8,
        },
        loadingText: {
            marginTop: SPACING.sm,
            color: colors.text,
            fontSize: FONT_SIZES.md,
        },
        cancelButton: {
            marginTop: SPACING.md,
            padding: SPACING.sm,
            backgroundColor: colors.error,
            borderRadius: 4,
        },
        cancelButtonText: {
            color: colors.background,
            fontSize: FONT_SIZES.sm,
            fontWeight: "600",
        },
    }));

    // Function to handle shared text (URLs)
    const handleSharedText = async () => {
        try {
            const initialUrl = await Linking.getInitialURL();
            if (initialUrl) {
                console.log("App opened from URL:", initialUrl);
                setUrl(initialUrl);

                const isYouTubeUrl =
                    initialUrl.includes("youtube.com/watch") ||
                    initialUrl.includes("youtu.be/") ||
                    initialUrl.includes("m.youtube.com/watch") ||
                    initialUrl.includes("youtube.com/v/") ||
                    initialUrl.includes("youtube.com/embed/") ||
                    initialUrl.includes("youtube.app.goo.gl") ||
                    initialUrl.includes("youtube.com/live/") ||
                    initialUrl.includes("m.youtube.com/live/");

                if (isYouTubeUrl) {
                    console.log(
                        "Auto-processing YouTube URL from initialUrl:",
                        initialUrl
                    );
                    setTimeout(() => {
                        processUrl(initialUrl);
                    }, 300);
                }
            }
        } catch (error) {
            console.error("Error handling shared text:", error);
        }
    };

    // Function to handle cancellation of summary generation
    const handleCancelSummary = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        setIsLoading(false);
        setElapsedTime(0);
        startTimeRef.current = null;
    };

    // Helper function to process a URL directly
    const processUrl = useCallback(
        async (urlToProcess) => {
            if (!isValidUrl || !urlToProcess) return;

            setIsLoading(true);
            startTimeRef.current = Date.now();
            abortControllerRef.current = new AbortController();

            timerRef.current = setInterval(() => {
                setElapsedTime(
                    Math.floor((Date.now() - startTimeRef.current) / 1000)
                );
            }, 1000);

            try {
                const summary = await generateSummary(
                    urlToProcess,
                    summaryType,
                    summaryLength,
                    abortControllerRef.current.signal
                );

                const timeTaken = Math.floor(
                    (Date.now() - startTimeRef.current) / 1000
                );
                summary.timeTaken = timeTaken > 0 ? timeTaken : 1;

                navigation.push(SCREENS.SUMMARY, { summary });

                refreshQueueCount();
            } catch (error) {
                console.error("Error processing URL:", error);

                if (error.name !== "AbortError") {
                    Alert.alert(
                        "Error",
                        "Failed to process the URL. Please try again."
                    );
                }
            } finally {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
                setIsLoading(false);
                setElapsedTime(0);
                abortControllerRef.current = null;
                startTimeRef.current = null;
            }
        },
        [summaryType, summaryLength, navigation, refreshQueueCount]
    );

    // Add function to refresh queue count
    const refreshQueueCount = useCallback(async () => {
        try {
            const queue = await queueService.getQueue();
            setQueueCount(queue.length);
        } catch (error) {
            console.error("Error refreshing queue count:", error);
        }
    }, []);

    // Add effect to refresh queue count when screen focuses
    useFocusEffect(
        useCallback(() => {
            refreshQueueCount();
        }, [refreshQueueCount])
    );

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
        handleSharedText();

        return () => {};
    }, []);

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

    const handleUrlChange = (text) => {
        setUrl(text);
        setIsValidUrl(true);
    };

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

    const handleSubmit = () => {
        if (!url.trim()) {
            setIsValidUrl(false);
            return;
        }

        processUrl(url);
    };

    useEffect(() => {
        if (route.params?.sharedUrl) {
            const sharedUrl = route.params.sharedUrl;
            const timestamp = route.params.timestamp || 0;
            const autoProcess = route.params.autoProcess || false;

            console.log(
                "Received shared URL in HomeScreen:",
                sharedUrl,
                "Timestamp:",
                timestamp,
                "Auto Process:",
                autoProcess
            );

            setUrl(sharedUrl);

            const timer = setTimeout(() => {
                console.log(
                    "Auto-processing shared URL in HomeScreen:",
                    sharedUrl
                );
                if (sharedUrl) {
                    processUrl(sharedUrl);
                }
            }, 300);

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

                    {queueCount > 0 && (
                        <View style={styles.queueIndicator}>
                            <Text style={styles.queueText}>
                                {queueCount} video{queueCount !== 1 ? "s" : ""}{" "}
                                in queue
                            </Text>
                        </View>
                    )}

                    {isLoading && (
                        <TouchableOpacity
                            style={styles.addAnotherButton}
                            onPress={() => {
                                navigation.push("Home");
                            }}
                        >
                            <View style={styles.addAnotherContent}>
                                <Ionicons
                                    name="add-circle-outline"
                                    size={24}
                                    color={colors.primary}
                                />
                                <Text style={styles.addAnotherText}>
                                    Add Another Video to Queue
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    {isLoading && (
                        <View style={styles.loadingIndicator}>
                            <ActivityIndicator
                                size="large"
                                color={colors.primary}
                            />
                            <Text style={styles.loadingText}>
                                Generating summary... ({elapsedTime}s)
                            </Text>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancelSummary}
                            >
                                <Text style={styles.cancelButtonText}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

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

export default HomeScreen;
