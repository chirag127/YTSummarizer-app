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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import components, services, and utilities
import {
    getTTSSettings,
    saveTTSSettings,
    getAvailableVoices,
} from "../services/tts";
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

    // Load settings and voices
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

    // Render rate options
    const renderRateOptions = () => {
        return (
            <View style={styles.settingSection}>
                <Text style={styles.settingTitle}>Speech Rate</Text>
                <Text style={styles.settingDescription}>
                    Adjust how fast the text is read aloud
                </Text>
                <View style={styles.optionsContainer}>
                    {TTS_RATE_OPTIONS.map((option) => (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.optionButton,
                                settings.rate === option.value &&
                                    styles.optionButtonSelected,
                            ]}
                            onPress={() => handleRateChange(option.value)}
                        >
                            <Text
                                style={[
                                    styles.optionButtonText,
                                    settings.rate === option.value &&
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
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading settings...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>
                        Text-to-Speech Settings
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        Customize how summaries are read aloud
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
                    <Text style={styles.aboutText}>© 2023 Chirag Singhal</Text>
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
