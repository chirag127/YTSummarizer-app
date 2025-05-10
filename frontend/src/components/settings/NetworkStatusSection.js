import React from "react";
import { StyleSheet, View, Text } from "react-native";
import PropTypes from "prop-types";
import { COLORS, SPACING, FONT_SIZES } from "../../constants";

/**
 * NetworkStatusSection component displays the current network connectivity status
 */
const NetworkStatusSection = ({ isOnline, type }) => {
  return (
    <View style={styles.settingSection}>
      <Text style={styles.settingTitle}>Network Status</Text>
      <View style={styles.networkStatusContainer}>
        <View style={styles.networkStatusItem}>
          <Text style={styles.networkStatusLabel}>Status:</Text>
          <View style={styles.networkStatusValue}>
            <View
              style={[
                styles.statusIndicator,
                {
                  backgroundColor: isOnline
                    ? COLORS.success
                    : COLORS.error,
                },
              ]}
            />
            <Text style={styles.networkStatusText}>
              {isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
        <View style={styles.networkStatusItem}>
          <Text style={styles.networkStatusLabel}>Type:</Text>
          <Text style={styles.networkStatusText}>
            {type || "Unknown"}
          </Text>
        </View>
      </View>
    </View>
  );
};

NetworkStatusSection.propTypes = {
  isOnline: PropTypes.bool.isRequired,
  type: PropTypes.string,
};

NetworkStatusSection.defaultProps = {
  type: "Unknown",
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
    marginBottom: SPACING.md,
  },
  networkStatusContainer: {
    marginTop: SPACING.sm,
  },
  networkStatusItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  networkStatusLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    width: 80,
  },
  networkStatusValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  networkStatusText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: SPACING.sm,
  },
});

export default NetworkStatusSection;
