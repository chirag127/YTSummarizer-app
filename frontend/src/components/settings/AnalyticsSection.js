import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { COLORS, SPACING, FONT_SIZES } from "../../constants";

/**
 * AnalyticsSection component displays analytics data for Q&A interactions
 */
const AnalyticsSection = ({ onShowAnalytics }) => {
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
          color={COLORS.background}
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

const styles = StyleSheet.create({
  settingSection: {
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
  },
  settingTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  analyticsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
  },
  analyticsButtonText: {
    color: COLORS.background,
    fontWeight: "600",
    marginLeft: SPACING.xs,
  },
});

export default AnalyticsSection;
