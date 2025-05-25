import React from "react";
import { View, Text } from "react-native";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * AboutSection component displays app information
 */
const AboutSection = ({ version, copyright }) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        aboutSection: {
            marginTop: SPACING.xl,
            marginBottom: SPACING.xl,
            alignItems: "center",
        },
        aboutTitle: {
            fontSize: FONT_SIZES.lg,
            fontWeight: "600",
            color: colors.text,
            marginBottom: SPACING.md,
        },
        aboutText: {
            fontSize: FONT_SIZES.sm,
            color: colors.textSecondary,
            marginBottom: SPACING.xs,
            textAlign: "center",
        },
    }));

    return (
        <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>About</Text>
            <Text style={styles.aboutText}>YouTube Summarizer v{version}</Text>
            <Text style={styles.aboutText}>
                Powered by Gemini 2.0 Flash-Lite AI
            </Text>
            <Text style={styles.aboutText}>{copyright}</Text>
        </View>
    );
};

AboutSection.propTypes = {
    version: PropTypes.string.isRequired,
    copyright: PropTypes.string.isRequired,
};

export default AboutSection;
