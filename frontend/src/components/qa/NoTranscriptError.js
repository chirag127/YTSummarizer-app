import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * Component to display when no transcript is available
 *
 * @param {Object} props - Component props
 * @param {Function} props.onRetry - Function to handle retry button press
 * @returns {React.ReactElement} NoTranscriptError component
 */
const NoTranscriptError = ({ onRetry }) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        centerContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: SPACING.xl,
        },
        errorText: {
            fontSize: FONT_SIZES.lg,
            color: colors.error,
            textAlign: "center",
            marginVertical: SPACING.md,
        },
        errorSubtext: {
            fontSize: FONT_SIZES.md,
            color: colors.textSecondary,
            textAlign: "center",
        },
        retryButton: {
            backgroundColor: colors.error,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.xs,
            borderRadius: 4,
            marginTop: SPACING.lg,
        },
        retryButtonText: {
            color: colors.background,
            fontSize: FONT_SIZES.sm,
            fontWeight: "500",
        },
    }));

    return (
        <View style={styles.centerContainer}>
            <Ionicons
                name="alert-circle-outline"
                size={48}
                color={colors.error}
            />
            <Text style={styles.errorText}>
                This video does not have a transcript available.
            </Text>
            <Text style={styles.errorSubtext}>
                The Q&A feature requires a video transcript to function.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
        </View>
    );
};

NoTranscriptError.propTypes = {
    onRetry: PropTypes.func.isRequired,
};

export default NoTranscriptError;
