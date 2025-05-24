import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES, TTS_PITCH_OPTIONS } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * TTSPitchSection component controls the pitch for text-to-speech
 */
const TTSPitchSection = ({ pitch, onPitchChange }) => {
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
        optionsContainer: {
            flexDirection: "row",
            flexWrap: "wrap",
        },
        optionButton: {
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.md,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            marginRight: SPACING.sm,
            marginBottom: SPACING.sm,
            backgroundColor: colors.background,
        },
        optionButtonSelected: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        optionButtonText: {
            fontSize: FONT_SIZES.sm,
            color: colors.text,
        },
        optionButtonTextSelected: {
            color: colors.background,
        },
    }));

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
                            pitch === option.value &&
                                styles.optionButtonSelected,
                        ]}
                        onPress={() => onPitchChange(option.value)}
                    >
                        <Text
                            style={[
                                styles.optionButtonText,
                                pitch === option.value &&
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

TTSPitchSection.propTypes = {
    pitch: PropTypes.number.isRequired,
    onPitchChange: PropTypes.func.isRequired,
};

export default TTSPitchSection;
