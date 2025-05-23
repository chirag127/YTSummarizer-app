import React from "react";
import { View, Text } from "react-native";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * HomeHeader component displays the title and subtitle for the HomeScreen
 *
 * @returns {React.ReactElement} HomeHeader component
 */
const HomeHeader = () => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        header: {
            marginTop: SPACING.xl,
            marginBottom: SPACING.xl,
            alignItems: "center",
        },
        title: {
            fontSize: FONT_SIZES.xxxl,
            fontWeight: "bold",
            color: colors.primary,
            marginBottom: SPACING.xs,
        },
        subtitle: {
            fontSize: FONT_SIZES.md,
            color: colors.textSecondary,
            textAlign: "center",
        },
    }));

    return (
        <View style={styles.header}>
            <Text style={styles.title}>YouTube Summarizer</Text>
            <Text style={styles.subtitle}>
                Get AI-powered summaries of YouTube videos
            </Text>
        </View>
    );
};

export default React.memo(HomeHeader);
