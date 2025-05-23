import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * Component to display a loading indicator
 *
 * @returns {React.ReactElement} LoadingIndicator component
 */
const LoadingIndicator = () => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        loadingContainer: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            padding: SPACING.sm,
            backgroundColor: colors.background,
        },
        loadingText: {
            marginLeft: SPACING.sm,
            fontSize: FONT_SIZES.sm,
            color: colors.textSecondary,
        },
    }));

    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>AI is thinking...</Text>
        </View>
    );
};

export default LoadingIndicator;
