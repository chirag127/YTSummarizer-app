import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * OtherSummaries component displays a list of other summaries for the same video
 *
 * @param {Object} props
 * @param {Array} props.summaries - Array of other summaries
 * @param {boolean} props.isLoading - Whether summaries are being loaded
 * @param {Function} props.onNavigateToSummary - Function to handle navigating to another summary
 * @param {Function} props.formatDateWithTimeZone - Function to format the date with timezone
 * @param {boolean} props.initiallyExpanded - Whether the list is initially expanded
 */
const OtherSummaries = ({
    summaries,
    isLoading,
    onNavigateToSummary,
    formatDateWithTimeZone,
    initiallyExpanded = false,
}) => {
    // Get theme colors
    const { colors } = useTheme();

    // State
    const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        otherSummariesContainer: {
            backgroundColor: colors.surface,
            borderRadius: 8,
            marginBottom: SPACING.lg,
            overflow: "hidden",
        },
        otherSummariesHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            padding: SPACING.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        otherSummariesTitle: {
            fontSize: FONT_SIZES.md,
            fontWeight: "bold",
            color: colors.text,
        },
        loadingContainer: {
            padding: SPACING.md,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
        },
        loadingText: {
            fontSize: FONT_SIZES.sm,
            color: colors.textSecondary,
            marginLeft: SPACING.sm,
        },
        otherSummariesList: {
            maxHeight: 300,
        },
        otherSummaryItem: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        otherSummaryInfo: {
            flex: 1,
        },
        otherSummaryBadges: {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 4,
            gap: 8,
        },
        badge: {
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
        },
        typeBadge: {
            backgroundColor: colors.primary + "80", // 50% opacity
        },
        lengthBadge: {
            backgroundColor: colors.secondary + "80", // 50% opacity
        },
        badgeText: {
            fontSize: FONT_SIZES.xs,
            color: colors.background,
            fontWeight: "500",
        },
        otherSummaryDate: {
            fontSize: FONT_SIZES.xs,
            color: colors.textSecondary,
        },
    }));

    if (summaries.length === 0) return null;

    return (
        <View style={styles.otherSummariesContainer}>
            <View style={styles.otherSummariesHeader}>
                <Text style={styles.otherSummariesTitle}>
                    Other Summaries for This Video
                </Text>
                <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
                    <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={24}
                        color={colors.primary}
                    />
                </TouchableOpacity>
            </View>

            {isLoading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.loadingText}>Loading summaries...</Text>
                </View>
            )}

            {isExpanded && !isLoading && (
                <FlatList
                    data={summaries}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.otherSummaryItem}
                            onPress={() => onNavigateToSummary(item)}
                        >
                            <View style={styles.otherSummaryInfo}>
                                <View style={styles.otherSummaryBadges}>
                                    <View
                                        style={[styles.badge, styles.typeBadge]}
                                    >
                                        <Text style={styles.badgeText}>
                                            {item.summary_type}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.badge,
                                            styles.lengthBadge,
                                        ]}
                                    >
                                        <Text style={styles.badgeText}>
                                            {item.summary_length}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.otherSummaryDate}>
                                    {formatDateWithTimeZone(item.created_at)}
                                </Text>
                            </View>
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>
                    )}
                    style={styles.otherSummariesList}
                    scrollEnabled={false}
                    nestedScrollEnabled={true}
                />
            )}
        </View>
    );
};

OtherSummaries.propTypes = {
    summaries: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired,
    onNavigateToSummary: PropTypes.func.isRequired,
    formatDateWithTimeZone: PropTypes.func.isRequired,
    initiallyExpanded: PropTypes.bool,
};

export default OtherSummaries;
