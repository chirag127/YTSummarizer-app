import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    Alert,
} from "react-native";
// Import components, services, and utilities
import {
    getTTSSettings,
    saveTTSSettings,
    getAvailableVoices,
} from "../services/tts";

import { COLORS, SPACING, FONT_SIZES } from "../constants";
import { useNetwork } from "../context/NetworkContext";
import * as storageService from "../services/storageService";
import * as cacheService from "../services/cacheService";
import * as queueService from "../services/queueService";
import * as syncService from "../services/syncService";
import * as analytics from "../services/analytics";

// Import settings components
import {
    NetworkStatusSection,
    OfflineDataSection,
    ApiKeySection,
    AnalyticsSection,
    TimeZoneSection,
    TTSRateSection,
    TTSPitchSection,
    TTSVoiceSection,
    TTSTestButton,
    AboutSection,
} from "../components/settings";

const SettingsScreen = () => {
    // State
    const [settings, setSettings] = useState({
        rate: 1.0,
        pitch: 1.0,
        voice: null,
    });
    const [voices, setVoices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Network status
    const { isConnected, isInternetReachable, type } = useNetwork();
    const isOnline = isConnected && isInternetReachable;

    // Cache info state
    const [cacheInfo, setCacheInfo] = useState({
        summariesSize: 0,
        thumbnailsSize: 0,
        lastUpdated: Date.now(),
    });
    const [isLoadingCacheInfo, setIsLoadingCacheInfo] = useState(true);
    const [queueCount, setQueueCount] = useState(0);
    const [syncLogCount, setSyncLogCount] = useState(0);
    const [isLoadingCounts, setIsLoadingCounts] = useState(true);

    // Load settings, voices, and API key
    useEffect(() => {
        const loadSettings = async () => {
            setIsLoading(true);
            try {
                // Load settings
                const savedSettings = await getTTSSettings();
                setSettings(savedSettings);

                // Load voices
                const availableVoices = await getAvailableVoices();
                setVoices(availableVoices);

                // Load API keys from the ApiKeySection component
            } catch (error) {
                console.error("Error loading settings:", error);
                Alert.alert("Error", "Failed to load settings.");
            } finally {
                setIsLoading(false);
            }
        };

        loadSettings();
    }, []);

    // Load cache info
    useEffect(() => {
        const loadCacheInfo = async () => {
            setIsLoadingCacheInfo(true);
            try {
                // Get cache info
                const info = await storageService.getCacheInfo();

                // Get actual thumbnail cache size
                const thumbnailSize = await cacheService.getCacheSize();

                setCacheInfo({
                    ...info,
                    thumbnailsSize: thumbnailSize,
                });
            } catch (error) {
                console.error("Error loading cache info:", error);
            } finally {
                setIsLoadingCacheInfo(false);
            }
        };

        loadCacheInfo();
    }, []);

    // Load queue and sync log counts
    useEffect(() => {
        const loadCounts = async () => {
            setIsLoadingCounts(true);
            try {
                // Get queue
                const queue = await queueService.getQueue();
                setQueueCount(queue.length);

                // Get sync log
                const syncLog = await syncService.getSyncLog();
                setSyncLogCount(syncLog.length);
            } catch (error) {
                console.error("Error loading counts:", error);
            } finally {
                setIsLoadingCounts(false);
            }
        };

        loadCounts();
    }, []);

    // Handle rate change
    const handleRateChange = (rate, saveToStorage = true) => {
        setSettings((prev) => ({ ...prev, rate }));
        if (saveToStorage) {
            saveSettings({ ...settings, rate });
        }
    };

    // Handle pitch change
    const handlePitchChange = (pitch) => {
        setSettings((prev) => ({ ...prev, pitch }));
        saveSettings({ ...settings, pitch });
    };

    // Handle voice change
    const handleVoiceChange = (voice) => {
        setSettings((prev) => ({ ...prev, voice }));
        saveSettings({ ...settings, voice });
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
            [{ text: "OK" }]
        );
    };

    // Save settings
    const saveSettings = async (newSettings) => {
        setIsSaving(true);
        try {
            await saveTTSSettings(newSettings);
        } catch (error) {
            console.error("Error saving settings:", error);
            Alert.alert("Error", "Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    // Format bytes to human-readable size
    const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return "0 Bytes";

        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return (
            parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
        );
    };

    // Handle clear summaries cache
    const handleClearSummariesCache = () => {
        Alert.alert(
            "Clear Summaries Cache",
            "Are you sure you want to clear all cached summaries? This will remove all offline summaries data.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await storageService.clearAllSummaries();

                            // Update cache info
                            setCacheInfo((prev) => ({
                                ...prev,
                                summariesSize: 0,
                                lastUpdated: Date.now(),
                            }));

                            Alert.alert(
                                "Success",
                                "Summaries cache has been cleared"
                            );
                        } catch (error) {
                            console.error(
                                "Error clearing summaries cache:",
                                error
                            );
                            Alert.alert(
                                "Error",
                                "Failed to clear summaries cache. Please try again."
                            );
                        }
                    },
                },
            ]
        );
    };

    // Handle clear thumbnails cache
    const handleClearThumbnailsCache = () => {
        Alert.alert(
            "Clear Thumbnails Cache",
            "Are you sure you want to clear all cached thumbnails? This will remove all offline thumbnail images.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await cacheService.clearImageCache();

                            // Update cache info
                            setCacheInfo((prev) => ({
                                ...prev,
                                thumbnailsSize: 0,
                                lastUpdated: Date.now(),
                            }));

                            Alert.alert(
                                "Success",
                                "Thumbnails cache has been cleared"
                            );
                        } catch (error) {
                            console.error(
                                "Error clearing thumbnails cache:",
                                error
                            );
                            Alert.alert(
                                "Error",
                                "Failed to clear thumbnails cache. Please try again."
                            );
                        }
                    },
                },
            ]
        );
    };

    // Handle clear queue
    const handleClearQueue = () => {
        Alert.alert(
            "Clear Queue",
            "Are you sure you want to clear the offline queue? This will remove all pending summary requests.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await queueService.clearQueue();
                            setQueueCount(0);

                            Alert.alert("Success", "Queue has been cleared");
                        } catch (error) {
                            console.error("Error clearing queue:", error);
                            Alert.alert(
                                "Error",
                                "Failed to clear queue. Please try again."
                            );
                        }
                    },
                },
            ]
        );
    };

    // Handle clear sync log
    const handleClearSyncLog = () => {
        Alert.alert(
            "Clear Sync Log",
            "Are you sure you want to clear the sync log? This will remove all pending changes that haven't been synced to the server.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await syncService.clearSyncLog();
                            setSyncLogCount(0);

                            Alert.alert("Success", "Sync log has been cleared");
                        } catch (error) {
                            console.error("Error clearing sync log:", error);
                            Alert.alert(
                                "Error",
                                "Failed to clear sync log. Please try again."
                            );
                        }
                    },
                },
            ]
        );
    };

    // Handle process queue
    const handleProcessQueue = async () => {
        if (!isOnline) {
            Alert.alert(
                "Offline",
                "You are currently offline. Please connect to the internet to process the queue."
            );
            return;
        }

        try {
            Alert.alert(
                "Process Queue",
                "Processing the queue will attempt to generate summaries for all pending requests. This may take some time. Do you want to continue?",
                [
                    {
                        text: "Cancel",
                        style: "cancel",
                    },
                    {
                        text: "Process",
                        onPress: async () => {
                            try {
                                const result =
                                    await syncService.processSyncLog();

                                if (result) {
                                    // Refresh sync log count
                                    const syncLog =
                                        await syncService.getSyncLog();
                                    setSyncLogCount(syncLog.length);

                                    Alert.alert(
                                        "Success",
                                        "Sync log has been processed successfully"
                                    );
                                } else {
                                    Alert.alert(
                                        "Warning",
                                        "Some items in the sync log could not be processed. Please try again later."
                                    );
                                }
                            } catch (error) {
                                console.error(
                                    "Error processing sync log:",
                                    error
                                );
                                Alert.alert(
                                    "Error",
                                    "Failed to process sync log. Please try again."
                                );
                            }
                        },
                    },
                ]
            );
        } catch (error) {
            console.error("Error processing queue:", error);
            Alert.alert("Error", "Failed to process queue. Please try again.");
        }
    };

    // Handle refresh voices
    const handleRefreshVoices = async () => {
        setIsLoading(true);
        try {
            const availableVoices = await getAvailableVoices();
            setVoices(availableVoices);
            if (availableVoices.length > 0) {
                Alert.alert(
                    "Success",
                    `Found ${availableVoices.length} voices on your device.`
                );
            } else {
                Alert.alert(
                    "No Voices Found",
                    "Your device doesn't have any text-to-speech voices installed, or they're not accessible to the app. The default system voice will be used."
                );
            }
        } catch (error) {
            console.error("Error refreshing voices:", error);
            Alert.alert("Error", "Failed to refresh voice list.");
        } finally {
            setIsLoading(false);
        }
    };

    // If loading, show loading indicator
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size={36} color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading settings...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <Text style={styles.headerSubtitle}>
                        Customize your YouTube Summarizer experience
                    </Text>
                </View>

                <NetworkStatusSection isOnline={isOnline} type={type} />

                <OfflineDataSection
                    cacheInfo={cacheInfo}
                    queueCount={queueCount}
                    syncLogCount={syncLogCount}
                    isLoading={isLoadingCacheInfo || isLoadingCounts}
                    onClearSummariesCache={handleClearSummariesCache}
                    onClearThumbnailsCache={handleClearThumbnailsCache}
                    onClearQueue={handleClearQueue}
                    onClearSyncLog={handleClearSyncLog}
                    onProcessQueue={handleProcessQueue}
                    isOnline={isOnline}
                    formatBytes={formatBytes}
                />

                <ApiKeySection />

                <AnalyticsSection onShowAnalytics={showAnalytics} />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>
                        Time Zone Settings
                    </Text>
                </View>

                <TimeZoneSection />

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>
                        Text-to-Speech Settings
                    </Text>
                </View>

                <TTSRateSection
                    rate={settings.rate}
                    onRateChange={handleRateChange}
                />

                <TTSPitchSection
                    pitch={settings.pitch}
                    onPitchChange={handlePitchChange}
                />

                <TTSTestButton settings={settings} isSaving={isSaving} />

                <TTSVoiceSection
                    voices={voices}
                    selectedVoice={settings.voice}
                    onVoiceChange={handleVoiceChange}
                    onRefreshVoices={handleRefreshVoices}
                    isLoading={isLoading}
                />

                <AboutSection
                    version="1.0.0"
                    copyright="© 2025 Chirag Singhal"
                />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        padding: SPACING.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: SPACING.md,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
    },
    header: {
        marginBottom: SPACING.xl,
    },
    headerTitle: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: "bold",
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    headerSubtitle: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
    },
    sectionHeader: {
        marginTop: SPACING.xl,
        marginBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        paddingBottom: SPACING.sm,
    },
    sectionHeaderText: {
        fontSize: FONT_SIZES.lg,
        fontWeight: "600",
        color: COLORS.text,
    },
});

export default SettingsScreen;
