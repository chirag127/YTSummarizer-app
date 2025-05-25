import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * TTSVoiceSection component allows selection of voice for text-to-speech
 */
const TTSVoiceSection = ({
    voices,
    selectedVoice,
    onVoiceChange,
    onRefreshVoices,
    isLoading,
}) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        settingSection: {
            marginBottom: SPACING.xl,
            backgroundColor: colors.surface,
            borderRadius: 8,
            padding: SPACING.md,
        },
        settingTitle: {
            fontSize: FONT_SIZES.lg,
            fontWeight: "600",
            color: colors.text,
            marginBottom: SPACING.xs,
        },
        settingDescription: {
            fontSize: FONT_SIZES.sm,
            color: colors.textSecondary,
            marginBottom: SPACING.md,
        },
        noVoicesContainer: {
            alignItems: "center",
            padding: SPACING.md,
            backgroundColor: colors.background,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            marginTop: SPACING.sm,
        },
        noVoicesText: {
            fontSize: FONT_SIZES.md,
            fontWeight: "600",
            color: colors.text,
            marginBottom: SPACING.sm,
            textAlign: "center",
        },
        noVoicesSubtext: {
            fontSize: FONT_SIZES.sm,
            color: colors.textSecondary,
            textAlign: "center",
            marginBottom: SPACING.md,
        },
        refreshVoicesButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.md,
            borderRadius: 8,
        },
        refreshVoicesButtonText: {
            color: colors.background,
            fontWeight: "600",
            marginLeft: SPACING.xs,
        },
        languageSection: {
            marginBottom: SPACING.md,
        },
        languageTitle: {
            fontSize: FONT_SIZES.md,
            fontWeight: "600",
            color: colors.text,
            marginBottom: SPACING.sm,
            marginTop: SPACING.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingBottom: SPACING.xs,
        },
        voicesContainer: {
            flexDirection: "row",
            flexWrap: "wrap",
        },
        voiceButton: {
            paddingVertical: SPACING.xs,
            paddingHorizontal: SPACING.sm,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            marginRight: SPACING.sm,
            marginBottom: SPACING.sm,
            backgroundColor: colors.background,
        },
        voiceButtonSelected: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        voiceButtonText: {
            fontSize: FONT_SIZES.xs,
            color: colors.text,
        },
        voiceButtonTextSelected: {
            color: colors.background,
        },
    }));

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
                        The app will use the system default voice. You can still
                        adjust the rate and pitch settings above.
                    </Text>
                    <TouchableOpacity
                        style={styles.refreshVoicesButton}
                        onPress={onRefreshVoices}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator
                                size="small"
                                color={colors.background}
                            />
                        ) : (
                            <>
                                <Ionicons
                                    name="refresh"
                                    size={18}
                                    color={colors.background}
                                />
                                <Text style={styles.refreshVoicesButtonText}>
                                    Refresh Voice List
                                </Text>
                            </>
                        )}
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
                                        selectedVoice === voice.identifier &&
                                            styles.voiceButtonSelected,
                                    ]}
                                    onPress={() =>
                                        onVoiceChange(voice.identifier)
                                    }
                                >
                                    <Text
                                        style={[
                                            styles.voiceButtonText,
                                            selectedVoice ===
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

TTSVoiceSection.propTypes = {
    voices: PropTypes.arrayOf(
        PropTypes.shape({
            identifier: PropTypes.string.isRequired,
            name: PropTypes.string,
            language: PropTypes.string,
        })
    ).isRequired,
    selectedVoice: PropTypes.string,
    onVoiceChange: PropTypes.func.isRequired,
    onRefreshVoices: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
};

TTSVoiceSection.defaultProps = {
    selectedVoice: null,
};

export default TTSVoiceSection;
