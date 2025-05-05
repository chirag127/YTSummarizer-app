import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Switch,
    ActivityIndicator,
    Alert,
    Platform,
    TextInput,
    Modal,
    FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import Slider from "@react-native-community/slider";
import * as WebBrowser from "expo-web-browser";
import * as Localization from "expo-localization";
import moment from "moment-timezone";

// Import components, services, and utilities
import {
    getTTSSettings,
    saveTTSSettings,
    getAvailableVoices,
} from "../services/tts";
import {
    saveApiKey,
    getApiKey,
    clearApiKey,
    testApiKey,
    hasApiKey,
} from "../services/apiKeyService";
import {
    COLORS,
    SPACING,
    FONT_SIZES,
    TTS_RATE_OPTIONS,
    TTS_PITCH_OPTIONS,
} from "../constants";
import { useNetwork } from "../context/NetworkContext";
import { useTimeZone } from "../context/TimeZoneContext";
import * as storageService from "../services/storageService";
import * as cacheService from "../services/cacheService";
import * as queueService from "../services/queueService";
import * as syncService from "../services/syncService";
import * as analytics from "../services/analytics";

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

    // API Key state
    const [apiKey, setApiKey] = useState("");
    const [hasStoredApiKey, setHasStoredApiKey] = useState(false);
    const [isTestingApiKey, setIsTestingApiKey] = useState(false);
    const [apiKeyVisible, setApiKeyVisible] = useState(false);

    // Network status
    const { isConnected, isInternetReachable, type } = useNetwork();
    const isOnline = isConnected && isInternetReachable;

    // Time Zone context and state
    const timeZoneContext = useTimeZone();
    const [timeZoneModalVisible, setTimeZoneModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredTimeZones, setFilteredTimeZones] = useState([]);

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

                // Check if user has stored API key
                const hasKey = await hasApiKey();
                setHasStoredApiKey(hasKey);

                // If we have a stored key, get a masked version for display
                if (hasKey) {
                    const storedKey = await getApiKey();
                    if (storedKey) {
                        // Mask the API key for display (show only last 4 characters)
                        const maskedKey =
                            storedKey.length > 4
                                ? "•".repeat(storedKey.length - 4) +
                                  storedKey.slice(-4)
                                : storedKey;
                        setApiKey(maskedKey);
                    }
                }
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
    const handleRateChange = (rate) => {
        setSettings((prev) => ({ ...prev, rate }));
        saveSettings({ ...settings, rate });
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

    // Render analytics section
    const renderAnalyticsSection = () => {
        return (
            <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Analytics</Text>
                <Text style={styles.settingDescription}>
                    View analytics data for Q&A interactions
                </Text>

                <TouchableOpacity
                    style={styles.analyticsButton}
                    onPress={showAnalytics}
                >
                    <Ionicons
                        name="analytics-outline"
                        size={20}
                        color={COLORS.background}
                    />
                    <Text style={styles.analyticsButtonText}>
                        View Q&A Analytics
                    </Text>
                </TouchableOpacity>
            </View>
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

    // Test TTS
    const testTTS = async () => {
        try {
            await Speech.stop();
            await Speech.speak(
                "This is a test of the text-to-speech settings.",
                {
                    rate: settings.rate,
                    pitch: settings.pitch,
                    voice: settings.voice,
                }
            );
        } catch (error) {
            console.error("Error testing TTS:", error);
            Alert.alert("Error", "Failed to test text-to-speech.");
        }
    };

    // Render rate options with slider
    const renderRateOptions = () => {
        // Find the closest preset rate option for visual feedback
        const getClosestRateLabel = (rate) => {
            // Find the closest rate option
            const closest = TTS_RATE_OPTIONS.reduce((prev, curr) => {
                return Math.abs(curr.value - rate) < Math.abs(prev.value - rate)
                    ? curr
                    : prev;
            });
            return closest.label;
        };

        // Calculate the color for the rate indicator based on the current rate
        const getRateColor = (rate) => {
            // Normalize the rate between 0 and 1 for color interpolation
            // Assuming min rate is 0.5 and max rate is 16.0
            const normalizedRate = Math.min(
                Math.max((rate - 0.5) / 15.5, 0),
                1
            );

            // Interpolate between blue (slow) and red (fast)
            const r = Math.round(normalizedRate * 255);
            const g = Math.round(50 + (1 - normalizedRate) * 100);
            const b = Math.round(255 - normalizedRate * 255);

            return `rgb(${r}, ${g}, ${b})`;
        };

        return (
            <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Speech Rate</Text>
                <Text style={styles.settingDescription}>
                    Adjust how fast the text is read aloud
                </Text>

                <View style={styles.sliderContainer}>
                    <View style={styles.sliderLabelsContainer}>
                        <Text style={styles.sliderLabel}>Slow</Text>
                        <View style={styles.currentRateContainer}>
                            <Text
                                style={[
                                    styles.currentRateValue,
                                    { color: getRateColor(settings.rate) },
                                ]}
                            >
                                {settings.rate.toFixed(2)}x
                            </Text>
                            <Text style={styles.currentRateLabel}>
                                {getClosestRateLabel(settings.rate)}
                            </Text>
                        </View>
                        <Text style={styles.sliderLabel}>Fast</Text>
                    </View>

                    <Slider
                        style={styles.slider}
                        minimumValue={0.5}
                        maximumValue={16.0}
                        step={0.1}
                        value={settings.rate}
                        onValueChange={(value) =>
                            setSettings((prev) => ({ ...prev, rate: value }))
                        }
                        onSlidingComplete={(value) => handleRateChange(value)}
                        minimumTrackTintColor={getRateColor(settings.rate)}
                        maximumTrackTintColor={COLORS.border}
                        thumbTintColor={getRateColor(settings.rate)}
                    />

                    <View style={styles.presetButtonsContainer}>
                        {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 6.0].map((rate) => (
                            <TouchableOpacity
                                key={rate}
                                style={[
                                    styles.presetButton,
                                    Math.abs(settings.rate - rate) < 0.1 &&
                                        styles.presetButtonSelected,
                                ]}
                                onPress={() => handleRateChange(rate)}
                            >
                                <Text
                                    style={[
                                        styles.presetButtonText,
                                        Math.abs(settings.rate - rate) < 0.1 &&
                                            styles.presetButtonTextSelected,
                                    ]}
                                >
                                    {rate.toFixed(1)}x
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        );
    };

    // Render pitch options
    const renderPitchOptions = () => {
        return (
            <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Speech Pitch</Text>
                <Text style={styles.settingDescription}>
                    Adjust the pitch of the voice
                </Text>
                <View style={styles.optionsContainer}>
                    {TTS_PITCH_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.optionButton,
                                settings.pitch === option.value &&
                                    styles.optionButtonSelected,
                            ]}
                            onPress={() => handlePitchChange(option.value)}
                        >
                            <Text
                                style={[
                                    styles.optionButtonText,
                                    settings.pitch === option.value &&
                                        styles.optionButtonTextSelected,
                                ]}
                            >
                                {option.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    // Render voice options
    const renderVoiceOptions = () => {
        // Group voices by language
        const voicesByLanguage = voices.reduce((acc, voice) => {
            const language = voice.language || "Unknown";
            if (!acc[language]) {
                acc[language] = [];
            }
            acc[language].push(voice);
            return acc;
        }, {});

        // Sort languages
        const sortedLanguages = Object.keys(voicesByLanguage).sort();

        return (
            <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Voice Selection</Text>
                <Text style={styles.settingDescription}>
                    Choose a voice for text-to-speech
                </Text>
                {voices.length === 0 ? (
                    <View style={styles.noVoicesContainer}>
                        <Text style={styles.noVoicesText}>
                            No voices available on this device
                        </Text>
                        <Text style={styles.noVoicesSubtext}>
                            The app will use the system default voice. You can
                            still adjust the rate and pitch settings above.
                        </Text>
                        <TouchableOpacity
                            style={styles.refreshVoicesButton}
                            onPress={async () => {
                                setIsLoading(true);
                                try {
                                    const availableVoices =
                                        await getAvailableVoices();
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
                                    console.error(
                                        "Error refreshing voices:",
                                        error
                                    );
                                    Alert.alert(
                                        "Error",
                                        "Failed to refresh voice list."
                                    );
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                        >
                            <Ionicons
                                name="refresh"
                                size={18}
                                color={COLORS.background}
                            />
                            <Text style={styles.refreshVoicesButtonText}>
                                Refresh Voice List
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    sortedLanguages.map((language) => (
                        <View key={language} style={styles.languageSection}>
                            <Text style={styles.languageTitle}>{language}</Text>
                            <View style={styles.voicesContainer}>
                                {voicesByLanguage[language].map((voice) => (
                                    <TouchableOpacity
                                        key={voice.identifier}
                                        style={[
                                            styles.voiceButton,
                                            settings.voice ===
                                                voice.identifier &&
                                                styles.voiceButtonSelected,
                                        ]}
                                        onPress={() =>
                                            handleVoiceChange(voice.identifier)
                                        }
                                    >
                                        <Text
                                            style={[
                                                styles.voiceButtonText,
                                                settings.voice ===
                                                    voice.identifier &&
                                                    styles.voiceButtonTextSelected,
                                            ]}
                                            numberOfLines={1}
                                        >
                                            {voice.name || "Unnamed Voice"}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    ))
                )}
            </View>
        );
    };

    // Render test button
    const renderTestButton = () => {
        return (
            <TouchableOpacity
                style={styles.testButton}
                onPress={testTTS}
                disabled={isSaving}
            >
                <Ionicons
                    name="volume-high"
                    size={20}
                    color={COLORS.background}
                />
                <Text style={styles.testButtonText}>Test Voice Settings</Text>
            </TouchableOpacity>
        );
    };

    // Handle time zone search
    const handleTimeZoneSearch = (text) => {
        setSearchQuery(text);
        if (!text.trim()) {
            setFilteredTimeZones([]);
            return;
        }

        // Get all time zones and filter based on search
        const allTimeZones = moment.tz.names();
        const filtered = allTimeZones.filter((tz) =>
            tz.toLowerCase().includes(text.toLowerCase())
        );

        setFilteredTimeZones(filtered);
    };

    // Render time zone settings section
    const renderTimeZoneSection = () => {
        const { timeZoneSettings, updateTimeZoneSettings, getCurrentTimeZone } =
            timeZoneContext;
        const currentTimeZone = getCurrentTimeZone();

        return (
            <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Time Zone Settings</Text>
                <Text style={styles.settingDescription}>
                    Configure how dates and times are displayed in the app
                </Text>

                <View style={styles.timeZoneContainer}>
                    <View style={styles.timeZoneRow}>
                        <Text style={styles.timeZoneLabel}>
                            Use Device Time Zone:
                        </Text>
                        <Switch
                            value={timeZoneSettings.useDeviceTimeZone}
                            onValueChange={(value) => {
                                updateTimeZoneSettings({
                                    useDeviceTimeZone: value,
                                });
                            }}
                            trackColor={{
                                false: COLORS.border,
                                true: COLORS.primary,
                            }}
                            thumbColor={COLORS.background}
                        />
                    </View>

                    <View style={styles.timeZoneRow}>
                        <Text style={styles.timeZoneLabel}>
                            Current Time Zone:
                        </Text>
                        <Text style={styles.timeZoneValue}>
                            {currentTimeZone}
                        </Text>
                    </View>

                    <View style={styles.timeZoneRow}>
                        <Text style={styles.timeZoneLabel}>Current Time:</Text>
                        <Text style={styles.timeZoneValue}>
                            {moment()
                                .tz(currentTimeZone)
                                .format("MMM D, YYYY h:mm A z")}
                        </Text>
                    </View>

                    {!timeZoneSettings.useDeviceTimeZone && (
                        <TouchableOpacity
                            style={styles.selectTimeZoneButton}
                            onPress={() => setTimeZoneModalVisible(true)}
                        >
                            <Ionicons
                                name="globe-outline"
                                size={18}
                                color={COLORS.background}
                            />
                            <Text style={styles.selectTimeZoneButtonText}>
                                Select Time Zone
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Time Zone Selection Modal */}
                <Modal
                    visible={timeZoneModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setTimeZoneModalVisible(false)}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    Select Time Zone
                                </Text>
                                <TouchableOpacity
                                    onPress={() =>
                                        setTimeZoneModalVisible(false)
                                    }
                                >
                                    <Ionicons
                                        name="close"
                                        size={24}
                                        color={COLORS.text}
                                    />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.searchContainer}>
                                <Ionicons
                                    name="search"
                                    size={20}
                                    color={COLORS.textSecondary}
                                />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Search time zones..."
                                    value={searchQuery}
                                    onChangeText={handleTimeZoneSearch}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                                {searchQuery ? (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setSearchQuery("");
                                            setFilteredTimeZones([]);
                                        }}
                                    >
                                        <Ionicons
                                            name="close-circle"
                                            size={20}
                                            color={COLORS.textSecondary}
                                        />
                                    </TouchableOpacity>
                                ) : null}
                            </View>

                            <FlatList
                                data={
                                    searchQuery
                                        ? filteredTimeZones
                                        : moment.tz.names()
                                }
                                keyExtractor={(item) => item}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.timeZoneItem,
                                            timeZoneSettings.selectedTimeZone ===
                                                item &&
                                                styles.timeZoneItemSelected,
                                        ]}
                                        onPress={() => {
                                            updateTimeZoneSettings({
                                                selectedTimeZone: item,
                                                useDeviceTimeZone: false,
                                            });
                                            setTimeZoneModalVisible(false);
                                            setSearchQuery("");
                                            setFilteredTimeZones([]);
                                        }}
                                    >
                                        <Text
                                            style={[
                                                styles.timeZoneItemText,
                                                timeZoneSettings.selectedTimeZone ===
                                                    item &&
                                                    styles.timeZoneItemTextSelected,
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                        <Text style={styles.timeZoneItemOffset}>
                                            {moment.tz(item).format("Z")}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                ItemSeparatorComponent={() => (
                                    <View style={styles.separator} />
                                )}
                                ListEmptyComponent={() => (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>
                                            {searchQuery
                                                ? "No time zones found"
                                                : "Loading time zones..."}
                                        </Text>
                                    </View>
                                )}
                            />
                        </View>
                    </View>
                </Modal>
            </View>
        );
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

    // Handle API key change
    const handleApiKeyChange = (text) => {
        setApiKey(text);
    };

    // Save API key
    const handleSaveApiKey = async () => {
        if (!apiKey.trim()) {
            Alert.alert("Error", "Please enter a valid API key.");
            return;
        }

        setIsSaving(true);
        try {
            const success = await saveApiKey(apiKey.trim());
            if (success) {
                setHasStoredApiKey(true);
                Alert.alert("Success", "API key saved successfully.");
            } else {
                Alert.alert("Error", "Failed to save API key.");
            }
        } catch (error) {
            console.error("Error saving API key:", error);
            Alert.alert("Error", "Failed to save API key.");
        } finally {
            setIsSaving(false);
        }
    };

    // Test API key
    const handleTestApiKey = async () => {
        if (!apiKey.trim()) {
            Alert.alert("Error", "Please enter a valid API key.");
            return;
        }

        setIsTestingApiKey(true);
        try {
            const result = await testApiKey(apiKey.trim());
            if (result.isValid) {
                Alert.alert("Success", "API key is valid!");
            } else {
                Alert.alert("Error", result.message);
            }
        } catch (error) {
            console.error("Error testing API key:", error);
            Alert.alert("Error", "Failed to test API key.");
        } finally {
            setIsTestingApiKey(false);
        }
    };

    // Clear API key
    const handleClearApiKey = async () => {
        Alert.alert(
            "Clear API Key",
            "Are you sure you want to remove your API key? The app will use the default key instead.",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        setIsSaving(true);
                        try {
                            const success = await clearApiKey();
                            if (success) {
                                setApiKey("");
                                setHasStoredApiKey(false);
                                Alert.alert(
                                    "Success",
                                    "API key removed successfully."
                                );
                            } else {
                                Alert.alert(
                                    "Error",
                                    "Failed to remove API key."
                                );
                            }
                        } catch (error) {
                            console.error("Error clearing API key:", error);
                            Alert.alert("Error", "Failed to remove API key.");
                        } finally {
                            setIsSaving(false);
                        }
                    },
                },
            ]
        );
    };

    // Open Google AI Studio website
    const handleOpenGoogleAIStudio = () => {
        Linking.openURL("https://makersuite.google.com/app/apikey");
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

    // Render API key section
    const renderApiKeySection = () => {
        return (
            <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Gemini API Key</Text>
                <Text style={styles.settingDescription}>
                    Enter your own Google Gemini API key to use for generating
                    summaries
                </Text>

                <View style={styles.apiKeyInputContainer}>
                    <TextInput
                        style={styles.apiKeyInput}
                        value={apiKey}
                        onChangeText={handleApiKeyChange}
                        placeholder="Enter your Gemini API key"
                        placeholderTextColor={COLORS.textSecondary}
                        secureTextEntry={!apiKeyVisible}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <TouchableOpacity
                        style={styles.visibilityButton}
                        onPress={() => setApiKeyVisible(!apiKeyVisible)}
                    >
                        <Ionicons
                            name={apiKeyVisible ? "eye-off" : "eye"}
                            size={24}
                            color={COLORS.textSecondary}
                        />
                    </TouchableOpacity>
                </View>

                <View style={styles.apiKeyButtonsContainer}>
                    <TouchableOpacity
                        style={[styles.apiKeyButton, styles.saveButton]}
                        onPress={handleSaveApiKey}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator
                                size="small"
                                color={COLORS.background}
                            />
                        ) : (
                            <>
                                <Ionicons
                                    name="save"
                                    size={18}
                                    color={COLORS.background}
                                />
                                <Text style={styles.apiKeyButtonText}>
                                    Save
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.apiKeyButton, styles.testButton]}
                        onPress={handleTestApiKey}
                        disabled={isTestingApiKey}
                    >
                        {isTestingApiKey ? (
                            <ActivityIndicator
                                size="small"
                                color={COLORS.background}
                            />
                        ) : (
                            <>
                                <Ionicons
                                    name="checkmark-circle"
                                    size={18}
                                    color={COLORS.background}
                                />
                                <Text style={styles.apiKeyButtonText}>
                                    Test
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {hasStoredApiKey && (
                        <TouchableOpacity
                            style={[styles.apiKeyButton, styles.clearButton]}
                            onPress={handleClearApiKey}
                            disabled={isSaving}
                        >
                            <Ionicons
                                name="trash"
                                size={18}
                                color={COLORS.background}
                            />
                            <Text style={styles.apiKeyButtonText}>Clear</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.getApiKeyLink}
                    onPress={handleOpenGoogleAIStudio}
                >
                    <Text style={styles.getApiKeyText}>
                        Get a Gemini API key from Google AI Studio
                    </Text>
                    <Ionicons
                        name="open-outline"
                        size={16}
                        color={COLORS.primary}
                    />
                </TouchableOpacity>

                <View style={styles.apiKeyInfoContainer}>
                    <Ionicons
                        name="information-circle"
                        size={20}
                        color={COLORS.textSecondary}
                    />
                    <Text style={styles.apiKeyInfoText}>
                        Using your own API key will count against your personal
                        quota. Your key is stored securely on your device and is
                        never shared.
                    </Text>
                </View>
            </View>
        );
    };

    // Render network status section
    const renderNetworkStatusSection = () => {
        return (
            <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Network Status</Text>
                <View style={styles.networkStatusContainer}>
                    <View style={styles.networkStatusItem}>
                        <Text style={styles.networkStatusLabel}>Status:</Text>
                        <View style={styles.networkStatusValue}>
                            <View
                                style={[
                                    styles.statusIndicator,
                                    {
                                        backgroundColor: isOnline
                                            ? COLORS.success
                                            : COLORS.error,
                                    },
                                ]}
                            />
                            <Text style={styles.networkStatusText}>
                                {isOnline ? "Online" : "Offline"}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.networkStatusItem}>
                        <Text style={styles.networkStatusLabel}>Type:</Text>
                        <Text style={styles.networkStatusText}>
                            {type || "Unknown"}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    // Render offline data section
    const renderOfflineDataSection = () => {
        return (
            <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Offline Data</Text>

                {isLoadingCacheInfo || isLoadingCounts ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                    <>
                        <View style={styles.cacheInfoContainer}>
                            <View style={styles.cacheInfoItem}>
                                <Text style={styles.cacheInfoLabel}>
                                    Summaries Cache:
                                </Text>
                                <Text style={styles.cacheInfoValue}>
                                    {formatBytes(cacheInfo.summariesSize)}
                                </Text>
                            </View>
                            <View style={styles.cacheInfoItem}>
                                <Text style={styles.cacheInfoLabel}>
                                    Thumbnails Cache:
                                </Text>
                                <Text style={styles.cacheInfoValue}>
                                    {formatBytes(cacheInfo.thumbnailsSize)}
                                </Text>
                            </View>
                            <View style={styles.cacheInfoItem}>
                                <Text style={styles.cacheInfoLabel}>
                                    Queue Items:
                                </Text>
                                <Text style={styles.cacheInfoValue}>
                                    {queueCount}
                                </Text>
                            </View>
                            <View style={styles.cacheInfoItem}>
                                <Text style={styles.cacheInfoLabel}>
                                    Pending Sync Actions:
                                </Text>
                                <Text style={styles.cacheInfoValue}>
                                    {syncLogCount}
                                </Text>
                            </View>
                            <View style={styles.cacheInfoItem}>
                                <Text style={styles.cacheInfoLabel}>
                                    Last Updated:
                                </Text>
                                <Text style={styles.cacheInfoValue}>
                                    {new Date(
                                        cacheInfo.lastUpdated
                                    ).toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.cacheActionsContainer}>
                            <TouchableOpacity
                                style={styles.cacheActionButton}
                                onPress={handleClearSummariesCache}
                            >
                                <Ionicons
                                    name="trash-outline"
                                    size={18}
                                    color={COLORS.error}
                                />
                                <Text style={styles.cacheActionButtonText}>
                                    Clear Summaries
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cacheActionButton}
                                onPress={handleClearThumbnailsCache}
                            >
                                <Ionicons
                                    name="image-outline"
                                    size={18}
                                    color={COLORS.error}
                                />
                                <Text style={styles.cacheActionButtonText}>
                                    Clear Thumbnails
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cacheActionButton}
                                onPress={handleClearQueue}
                                disabled={queueCount === 0}
                            >
                                <Ionicons
                                    name="time-outline"
                                    size={18}
                                    color={
                                        queueCount === 0
                                            ? COLORS.disabled
                                            : COLORS.error
                                    }
                                />
                                <Text
                                    style={[
                                        styles.cacheActionButtonText,
                                        queueCount === 0 && {
                                            color: COLORS.disabled,
                                        },
                                    ]}
                                >
                                    Clear Queue
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cacheActionButton}
                                onPress={handleClearSyncLog}
                                disabled={syncLogCount === 0}
                            >
                                <Ionicons
                                    name="sync-outline"
                                    size={18}
                                    color={
                                        syncLogCount === 0
                                            ? COLORS.disabled
                                            : COLORS.error
                                    }
                                />
                                <Text
                                    style={[
                                        styles.cacheActionButtonText,
                                        syncLogCount === 0 && {
                                            color: COLORS.disabled,
                                        },
                                    ]}
                                >
                                    Clear Sync Log
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.processQueueButton,
                                    (!isOnline || queueCount === 0) &&
                                        styles.disabledButton,
                                ]}
                                onPress={handleProcessQueue}
                                disabled={!isOnline || queueCount === 0}
                            >
                                <Ionicons
                                    name="cloud-upload-outline"
                                    size={18}
                                    color={COLORS.background}
                                />
                                <Text style={styles.processQueueButtonText}>
                                    Process Queue Now
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <Text style={styles.headerSubtitle}>
                        Customize your YouTube Summarizer experience
                    </Text>
                </View>

                {renderNetworkStatusSection()}
                {renderOfflineDataSection()}
                {renderApiKeySection()}
                {renderAnalyticsSection()}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>
                        Time Zone Settings
                    </Text>
                </View>

                {renderTimeZoneSection()}

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>
                        Text-to-Speech Settings
                    </Text>
                </View>

                {renderRateOptions()}
                {renderPitchOptions()}
                {renderTestButton()}
                {renderVoiceOptions()}

                <View style={styles.aboutSection}>
                    <Text style={styles.aboutTitle}>About</Text>
                    <Text style={styles.aboutText}>
                        YouTube Summarizer v1.0.0
                    </Text>
                    <Text style={styles.aboutText}>
                        Powered by Gemini 2.0 Flash-Lite AI
                    </Text>
                    <Text style={styles.aboutText}>© 2025 Chirag Singhal</Text>
                </View>
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
    settingSection: {
        marginBottom: SPACING.xl,
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        padding: SPACING.md,
    },
    settingTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    settingDescription: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.md,
    },
    optionsContainer: {
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
        backgroundColor: COLORS.background,
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
    // Slider styles
    sliderContainer: {
        marginVertical: SPACING.md,
    },
    sliderLabelsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.sm,
    },
    sliderLabel: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
    },
    currentRateContainer: {
        alignItems: "center",
    },
    currentRateValue: {
        fontSize: FONT_SIZES.lg,
        fontWeight: "bold",
    },
    currentRateLabel: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    slider: {
        width: "100%",
        height: 40,
    },
    presetButtonsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: SPACING.sm,
    },
    presetButton: {
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    presetButtonSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    presetButtonText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.text,
    },
    presetButtonTextSelected: {
        color: COLORS.background,
    },
    languageSection: {
        marginBottom: SPACING.md,
    },
    languageTitle: {
        fontSize: FONT_SIZES.md,
        fontWeight: "500",
        color: COLORS.text,
        marginBottom: SPACING.sm,
        backgroundColor: COLORS.background,
        paddingVertical: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        borderRadius: 4,
        alignSelf: "flex-start",
    },
    voicesContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    voiceButton: {
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: SPACING.sm,
        marginBottom: SPACING.sm,
        backgroundColor: COLORS.background,
        maxWidth: "45%",
    },
    voiceButtonSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    voiceButtonText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.text,
    },
    voiceButtonTextSelected: {
        color: COLORS.background,
    },
    noVoicesContainer: {
        alignItems: "center",
        padding: SPACING.md,
        backgroundColor: COLORS.background,
        borderRadius: 8,
        marginTop: SPACING.md,
    },
    noVoicesText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        fontWeight: "500",
        textAlign: "center",
        marginBottom: SPACING.sm,
    },
    noVoicesSubtext: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        textAlign: "center",
        marginBottom: SPACING.md,
    },
    refreshVoicesButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 20,
        marginTop: SPACING.sm,
    },
    refreshVoicesButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.sm,
        fontWeight: "500",
        marginLeft: SPACING.xs,
    },
    testButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: SPACING.md,
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: SPACING.xl,
    },
    testButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.md,
        fontWeight: "600",
        marginLeft: SPACING.sm,
    },
    // API Key styles
    apiKeyInputContainer: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        marginBottom: SPACING.md,
        backgroundColor: COLORS.background,
    },
    apiKeyInput: {
        flex: 1,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
    },
    visibilityButton: {
        padding: SPACING.md,
        justifyContent: "center",
        alignItems: "center",
    },
    apiKeyButtonsContainer: {
        flexDirection: "row",
        marginBottom: SPACING.md,
    },
    apiKeyButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 8,
        marginRight: SPACING.md,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    testButton: {
        backgroundColor: COLORS.success,
    },
    clearButton: {
        backgroundColor: COLORS.error,
    },
    apiKeyButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.sm,
        fontWeight: "600",
        marginLeft: SPACING.xs,
    },
    getApiKeyLink: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: SPACING.md,
    },
    getApiKeyText: {
        color: COLORS.primary,
        fontSize: FONT_SIZES.sm,
        marginRight: SPACING.xs,
        textDecorationLine: "underline",
    },
    apiKeyInfoContainer: {
        flexDirection: "row",
        backgroundColor: COLORS.infoBackground,
        padding: SPACING.md,
        borderRadius: 8,
        alignItems: "flex-start",
    },
    apiKeyInfoText: {
        flex: 1,
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginLeft: SPACING.sm,
    },
    aboutSection: {
        marginTop: SPACING.xl,
        alignItems: "center",
        paddingTop: SPACING.xl,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    aboutTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    aboutText: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        textAlign: "center",
    },
    // Network status styles
    networkStatusContainer: {
        marginTop: SPACING.sm,
    },
    networkStatusItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: SPACING.sm,
    },
    networkStatusLabel: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        width: 80,
    },
    networkStatusValue: {
        flexDirection: "row",
        alignItems: "center",
    },
    networkStatusText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
    },
    statusIndicator: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: SPACING.sm,
    },
    // Cache info styles
    cacheInfoContainer: {
        marginTop: SPACING.sm,
    },
    cacheInfoItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: SPACING.sm,
    },
    cacheInfoLabel: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        width: 150,
    },
    cacheInfoValue: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
    },
    cacheActionsContainer: {
        marginTop: SPACING.md,
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    cacheActionButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.error,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 4,
        marginBottom: SPACING.sm,
        width: "48%",
    },
    cacheActionButtonText: {
        color: COLORS.error,
        marginLeft: SPACING.sm,
        fontSize: FONT_SIZES.sm,
    },
    processQueueButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 4,
        marginTop: SPACING.sm,
        width: "100%",
    },
    processQueueButtonText: {
        color: COLORS.background,
        marginLeft: SPACING.sm,
        fontWeight: "bold",
    },
    disabledButton: {
        backgroundColor: COLORS.disabled,
    },
    analyticsButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: 8,
        alignSelf: "center",
    },
    analyticsButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.md,
        fontWeight: "600",
        marginLeft: SPACING.sm,
    },
    // Time Zone styles
    timeZoneContainer: {
        marginTop: SPACING.md,
    },
    timeZoneRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.md,
    },
    timeZoneLabel: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        flex: 1,
    },
    timeZoneValue: {
        fontSize: FONT_SIZES.md,
        color: COLORS.primary,
        fontWeight: "500",
        flex: 1,
        textAlign: "right",
    },
    selectTimeZoneButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: 8,
        marginTop: SPACING.sm,
    },
    selectTimeZoneButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.md,
        fontWeight: "500",
        marginLeft: SPACING.xs,
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    modalContent: {
        width: "90%",
        height: "80%",
        backgroundColor: COLORS.background,
        borderRadius: 12,
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: "600",
        color: COLORS.text,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        margin: SPACING.md,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        marginLeft: SPACING.sm,
        paddingVertical: SPACING.xs,
    },
    timeZoneItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
    },
    timeZoneItemSelected: {
        backgroundColor: COLORS.primary + "20", // Add transparency
    },
    timeZoneItemText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        flex: 1,
    },
    timeZoneItemTextSelected: {
        fontWeight: "600",
        color: COLORS.primary,
    },
    timeZoneItemOffset: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginLeft: SPACING.sm,
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: SPACING.md,
    },
    emptyContainer: {
        padding: SPACING.xl,
        alignItems: "center",
    },
    emptyText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        textAlign: "center",
    },
});

export default SettingsScreen;
