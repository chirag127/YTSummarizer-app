import React from "react";
import { View, Text } from "react-native";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * NetworkStatusSection component displays the current network connectivity status
 */
const NetworkStatusSection = ({ isOnline, type }) => {
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
            color: colors.textSecondary,
            width: 80,
        },
        networkStatusValue: {
            flexDirection: "row",
            alignItems: "center",
        },
        networkStatusText: {
            fontSize: FONT_SIZES.md,
            color: colors.text,
        },
        statusIndicator: {
            width: 10,
            height: 10,
            borderRadius: 5,
            marginRight: SPACING.sm,
        },
    }));

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
                                        ? colors.success
                                        : colors.error,
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

export default NetworkStatusSection;
