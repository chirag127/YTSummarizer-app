import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * Component to display during initial loading
 *
 * @returns {React.ReactElement} InitialLoading component
 */
const InitialLoading = () => {
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
        loadingText: {
            marginTop: SPACING.md,
            fontSize: FONT_SIZES.md,
            color: colors.textSecondary,
            textAlign: "center",
        },
    }));

    return (
        <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>
                Loading conversation history...
            </Text>
        </View>
    );
};

export default InitialLoading;
