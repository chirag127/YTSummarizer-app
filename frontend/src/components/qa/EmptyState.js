import React from "react";
import { View, Text } from "react-native";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * Component to display when there are no messages in the chat
 *
 * @returns {React.ReactElement} EmptyState component
 */
const EmptyState = () => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        emptyContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: SPACING.xl,
            opacity: 0.8,
        },
        emptyText: {
            fontSize: FONT_SIZES.lg,
            color: colors.text,
            textAlign: "center",
            marginBottom: SPACING.sm,
        },
        emptySubtext: {
            fontSize: FONT_SIZES.md,
            color: colors.textSecondary,
            textAlign: "center",
        },
    }));

    return (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
                Ask a question about the video content
            </Text>
            <Text style={styles.emptySubtext}>
                The AI will answer based on the video transcript
            </Text>
        </View>
    );
};

export default EmptyState;
