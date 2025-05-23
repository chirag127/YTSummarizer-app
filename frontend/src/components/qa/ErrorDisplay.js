import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * Component to display an error message with retry option
 *
 * @param {Object} props - Component props
 * @param {Object} props.error - Error object with message
 * @param {Function} props.onRetry - Function to handle retry button press
 * @param {boolean} props.isRetrying - Whether the app is retrying
 * @returns {React.ReactElement} ErrorDisplay component
 */
const ErrorDisplay = ({ error, onRetry, isRetrying }) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        errorBanner: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: `${colors.error}20`, // 20% opacity
            padding: SPACING.sm,
            borderRadius: 8,
            margin: SPACING.md,
            borderWidth: 1,
            borderColor: colors.error,
        },
        errorContent: {
            flexDirection: "row",
            alignItems: "center",
            flex: 1,
        },
        errorMessage: {
            fontSize: FONT_SIZES.sm,
            color: colors.error,
            marginLeft: SPACING.xs,
            flex: 1,
        },
        retryButton: {
            backgroundColor: colors.error,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.xs,
            borderRadius: 4,
            marginLeft: SPACING.sm,
        },
        retryButtonText: {
            color: colors.background,
            fontSize: FONT_SIZES.sm,
            fontWeight: "500",
        },
    }));

    return (
        <View style={styles.errorBanner}>
            <View style={styles.errorContent}>
                <Ionicons
                    name="alert-circle-outline"
                    size={20}
                    color={colors.error}
                />
                <Text style={styles.errorMessage}>{error.message}</Text>
            </View>
            <TouchableOpacity
                style={styles.retryButton}
                onPress={onRetry}
                disabled={isRetrying}
            >
                {isRetrying ? (
                    <ActivityIndicator size="small" color={colors.background} />
                ) : (
                    <Text style={styles.retryButtonText}>Retry</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

ErrorDisplay.propTypes = {
    error: PropTypes.shape({
        message: PropTypes.string.isRequired,
        type: PropTypes.string,
    }).isRequired,
    onRetry: PropTypes.func.isRequired,
    isRetrying: PropTypes.bool.isRequired,
};

export default ErrorDisplay;
