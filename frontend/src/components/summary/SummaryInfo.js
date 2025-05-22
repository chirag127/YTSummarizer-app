import React from "react";
import { StyleSheet, View, Text } from "react-native";
import PropTypes from "prop-types";

import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * SummaryInfo component displays metadata about the summary
 *
 * @param {Object} props
 * @param {string} props.summaryType - The type of summary
 * @param {string} props.summaryLength - The length of summary
 * @param {string} props.createdAt - The creation date of the summary
 * @param {number} props.timeTaken - The time taken to generate the summary in seconds
 * @param {Function} props.formatSummaryType - Function to format the summary type
 * @param {Function} props.formatSummaryLength - Function to format the summary length
 * @param {Function} props.formatDateWithTimeZone - Function to format the date with timezone
 */
const SummaryInfo = ({
    summaryType,
    summaryLength,
    createdAt,
    timeTaken,
    formatSummaryType,
    formatSummaryLength,
    formatDateWithTimeZone,
}) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        summaryInfoContainer: {
            marginBottom: SPACING.md,
        },
        summaryTypeContainer: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            backgroundColor: colors.surface,
            borderRadius: 8,
            padding: SPACING.md,
        },
        summaryTypeItem: {
            marginBottom: SPACING.sm,
            minWidth: "30%",
        },
        summaryTypeLabel: {
            fontSize: FONT_SIZES.sm,
            color: colors.textSecondary,
            marginBottom: 2,
        },
        summaryTypeValue: {
            fontSize: FONT_SIZES.md,
            color: colors.text,
            fontWeight: "500",
        },
    }));

    return (
        <View style={styles.summaryInfoContainer}>
            <View style={styles.summaryTypeContainer}>
                <View style={styles.summaryTypeItem}>
                    <Text style={styles.summaryTypeLabel}>Type:</Text>
                    <Text style={styles.summaryTypeValue}>
                        {formatSummaryType(summaryType)}
                    </Text>
                </View>
                <View style={styles.summaryTypeItem}>
                    <Text style={styles.summaryTypeLabel}>Length:</Text>
                    <Text style={styles.summaryTypeValue}>
                        {formatSummaryLength(summaryLength)}
                    </Text>
                </View>
                <View style={styles.summaryTypeItem}>
                    <Text style={styles.summaryTypeLabel}>Created:</Text>
                    <Text style={styles.summaryTypeValue}>
                        {formatDateWithTimeZone(createdAt)}
                    </Text>
                </View>
                {timeTaken !== undefined && (
                    <View style={styles.summaryTypeItem}>
                        <Text style={styles.summaryTypeLabel}>Time Taken:</Text>
                        <Text style={styles.summaryTypeValue}>
                            {timeTaken} seconds
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

SummaryInfo.propTypes = {
    summaryType: PropTypes.string.isRequired,
    summaryLength: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    timeTaken: PropTypes.number,
    formatSummaryType: PropTypes.func.isRequired,
    formatSummaryLength: PropTypes.func.isRequired,
    formatDateWithTimeZone: PropTypes.func.isRequired,
};

export default SummaryInfo;
