import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";
import { SPACING, FONT_SIZES } from "../../constants";

/**
 * ActionButtons component for the HomeScreen
 * Displays either a loading indicator with cancel button or a generate summary button
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Whether a summary is currently being generated
 * @param {number} props.elapsedTime - The elapsed time in seconds for the current generation
 * @param {Function} props.onSubmit - Function to handle generate summary button press
 * @param {Function} props.onCancel - Function to handle cancel button press
 * @returns {React.ReactElement} ActionButtons component
 */
const ActionButtons = ({ isLoading, elapsedTime, onSubmit, onCancel }) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        button: {
            backgroundColor: colors.primary,
            borderRadius: 8,
            paddingVertical: SPACING.md,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginTop: SPACING.md,
        },
        buttonText: {
            color: colors.background,
            fontSize: FONT_SIZES.md,
            fontWeight: "600",
            marginLeft: SPACING.sm,
        },
        loadingContainer: {
            marginTop: SPACING.md,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: SPACING.md,
        },
        loadingInfo: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: SPACING.md,
        },
        loadingText: {
            marginLeft: SPACING.md,
            fontSize: FONT_SIZES.md,
            color: colors.text,
        },
        cancelButton: {
            backgroundColor: colors.surface,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.error,
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.md,
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
        },
        cancelButtonText: {
            color: colors.error,
            fontSize: FONT_SIZES.md,
            fontWeight: "600",
            marginLeft: SPACING.sm,
        },
    }));

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <View style={styles.loadingInfo}>
                    <ActivityIndicator color={colors.primary} size="small" />
                    <Text style={styles.loadingText}>
                        Generating summary... {elapsedTime}s
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onCancel}
                >
                    <Ionicons
                        name="close-circle"
                        size={20}
                        color={colors.error}
                    />
                    <Text style={styles.cancelButtonText}>Stop</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <TouchableOpacity style={styles.button} onPress={onSubmit}>
            <Ionicons
                name="document-text"
                size={20}
                color={colors.background}
            />
            <Text style={styles.buttonText}>Generate Summary</Text>
        </TouchableOpacity>
    );
};

ActionButtons.propTypes = {
    isLoading: PropTypes.bool.isRequired,
    elapsedTime: PropTypes.number.isRequired,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default React.memo(ActionButtons);
