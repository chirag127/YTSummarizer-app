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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import Slider from "@react-native-community/slider";

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
                        {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((rate) => (
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
                    <Text style={styles.noVoicesText}>
                        No voices available on this device
                    </Text>
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

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Settings</Text>
                    <Text style={styles.headerSubtitle}>
                        Customize your YouTube Summarizer experience
                    </Text>
                </View>

                {renderApiKeySection()}

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
    noVoicesText: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        fontStyle: "italic",
        textAlign: "center",
        marginTop: SPACING.md,
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
});

export default SettingsScreen;
