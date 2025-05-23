import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";
import { SPACING, FONT_SIZES, SHADOWS } from "../../constants";

/**
 * LoadingOverlay component displays a loading overlay during summary regeneration
 *
 * @param {Object} props
 * @param {boolean} props.visible - Whether the overlay is visible
 * @param {number} props.elapsedTime - The elapsed time in seconds
 * @param {Function} props.onCancel - Function to handle canceling the regeneration
 */
const LoadingOverlay = ({ visible, elapsedTime, onCancel }) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        loadingOverlay: {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
        },
        loadingCard: {
            backgroundColor: colors.background,
            borderRadius: 8,
            padding: SPACING.lg,
            width: "80%",
            maxWidth: 300,
            alignItems: "center",
            ...SHADOWS.medium,
        },
        loadingText: {
            fontSize: FONT_SIZES.md,
            color: colors.text,
            marginTop: SPACING.md,
            marginBottom: SPACING.md,
            textAlign: "center",
        },
        cancelButton: {
            flexDirection: "row",
            alignItems: "center",
            padding: SPACING.sm,
            borderRadius: 4,
            backgroundColor: colors.surface,
        },
        cancelButtonText: {
            fontSize: FONT_SIZES.sm,
            color: colors.error,
            marginLeft: 4,
        },
    }));

    if (!visible) return null;

    return (
        <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>
                    Regenerating summary... {elapsedTime}s
                </Text>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onCancel}
                >
                    <Ionicons
                        name="close-circle"
                        size={20}
                        color={colors.error}
                    />
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

LoadingOverlay.propTypes = {
    visible: PropTypes.bool.isRequired,
    elapsedTime: PropTypes.number.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default LoadingOverlay;
