import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * AnalyticsSection component displays analytics data for Q&A interactions
 */
const AnalyticsSection = ({ onShowAnalytics }) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        settingSection: {
            marginBottom: SPACING.xl,
            backgroundColor: colors.surface,
            borderRadius: 8,
            padding: SPACING.md,
        },
        settingTitle: {
            fontSize: FONT_SIZES.lg,
            fontWeight: "600",
            color: colors.text,
            marginBottom: SPACING.xs,
        },
        settingDescription: {
            fontSize: FONT_SIZES.sm,
            color: colors.textSecondary,
            marginBottom: SPACING.md,
        },
        analyticsButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.md,
            borderRadius: 8,
        },
        analyticsButtonText: {
            color: colors.background,
            fontWeight: "600",
            marginLeft: SPACING.xs,
        },
    }));

    return (
        <View style={styles.settingSection}>
            <Text style={styles.settingTitle}>Analytics</Text>
            <Text style={styles.settingDescription}>
                View analytics data for Q&A interactions
            </Text>

            <TouchableOpacity
                style={styles.analyticsButton}
                onPress={onShowAnalytics}
            >
                <Ionicons
                    name="analytics-outline"
                    size={20}
                    color={colors.background}
                />
                <Text style={styles.analyticsButtonText}>
                    View Q&A Analytics
                </Text>
            </TouchableOpacity>
        </View>
    );
};

AnalyticsSection.propTypes = {
    onShowAnalytics: PropTypes.func.isRequired,
};

export default AnalyticsSection;
