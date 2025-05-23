import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";
import { SPACING, FONT_SIZES } from "../../constants";

/**
 * VideoInput component for entering YouTube URLs
 *
 * @param {Object} props - Component props
 * @param {string} props.url - The current URL value
 * @param {boolean} props.isValidUrl - Whether the URL is valid
 * @param {Function} props.onUrlChange - Function to handle URL changes
 * @param {Function} props.onPasteFromClipboard - Function to handle pasting from clipboard
 * @returns {React.ReactElement} VideoInput component
 */
const VideoInput = ({ url, isValidUrl, onUrlChange, onPasteFromClipboard }) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
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
            borderColor: colors.border,
            borderRadius: 8,
            paddingHorizontal: SPACING.md,
            fontSize: FONT_SIZES.md,
            backgroundColor: colors.surface,
            color: colors.text,
        },
        inputError: {
            borderColor: colors.error,
        },
        pasteButton: {
            marginLeft: SPACING.sm,
            padding: SPACING.sm,
            borderRadius: 8,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
        },
        errorText: {
            color: colors.error,
            fontSize: FONT_SIZES.sm,
            marginTop: SPACING.xs,
        },
    }));

    return (
        <View style={styles.inputContainer}>
            <View style={styles.inputRow}>
                <TextInput
                    style={[styles.input, !isValidUrl && styles.inputError]}
                    placeholder="Paste YouTube URL here"
                    placeholderTextColor={colors.textSecondary}
                    value={url}
                    onChangeText={onUrlChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                />
                <TouchableOpacity
                    style={styles.pasteButton}
                    onPress={onPasteFromClipboard}
                    accessibilityLabel="Paste from clipboard"
                    accessibilityHint="Pastes YouTube URL from clipboard"
                >
                    <Ionicons
                        name="clipboard-outline"
                        size={24}
                        color={colors.primary}
                    />
                </TouchableOpacity>
            </View>
            {!isValidUrl && (
                <Text style={styles.errorText}>
                    Please enter a valid YouTube URL
                </Text>
            )}
        </View>
    );
};

VideoInput.propTypes = {
    url: PropTypes.string.isRequired,
    isValidUrl: PropTypes.bool.isRequired,
    onUrlChange: PropTypes.func.isRequired,
    onPasteFromClipboard: PropTypes.func.isRequired,
};

export default React.memo(VideoInput);
