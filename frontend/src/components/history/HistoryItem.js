import React from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from "../../constants";

/**
 * HistoryItem component for rendering individual summary items
 *
 * @param {Object} props - Component props
 * @param {Object} props.item - Summary item data
 * @param {Function} props.onPress - Function to handle pressing the item
 * @param {Function} props.onToggleStar - Function to handle toggling the star status
 * @param {Function} props.onDelete - Function to handle deleting the item
 * @param {Function} props.formatDate - Function to format the date
 * @returns {React.ReactElement} HistoryItem component
 */
const HistoryItem = ({ item, onPress, onToggleStar, onDelete, formatDate }) => {
    return (
        <TouchableOpacity
            style={styles.summaryItem}
            onPress={() => onPress(item)}
        >
            <Image
                source={{
                    uri:
                        item.video_thumbnail_url ||
                        "https://via.placeholder.com/480x360?text=No+Thumbnail",
                }}
                style={styles.thumbnail}
                resizeMode="cover"
            />
            <View style={styles.summaryInfo}>
                <Text style={styles.summaryTitle} numberOfLines={2}>
                    {item.video_title || "Untitled Video"}
                </Text>
                <Text style={styles.summaryDate}>
                    {formatDate(item.created_at)}
                </Text>
                <View style={styles.summaryTypeContainer}>
                    <View style={[styles.badge, styles.typeBadge]}>
                        <Text style={styles.badgeText}>
                            {item.summary_type}
                        </Text>
                    </View>
                    <View style={[styles.badge, styles.lengthBadge]}>
                        <Text style={styles.badgeText}>
                            {item.summary_length}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onToggleStar(item.id, item.is_starred)}
                >
                    <Ionicons
                        name={item.is_starred ? "star" : "star-outline"}
                        size={20}
                        color={
                            item.is_starred
                                ? COLORS.accent
                                : COLORS.textSecondary
                        }
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => onDelete(item.id)}
                >
                    <Ionicons
                        name="trash-outline"
                        size={20}
                        color={COLORS.error}
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

HistoryItem.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.string.isRequired,
        video_title: PropTypes.string,
        video_thumbnail_url: PropTypes.string,
        created_at: PropTypes.string.isRequired,
        summary_type: PropTypes.string.isRequired,
        summary_length: PropTypes.string.isRequired,
        is_starred: PropTypes.bool,
    }).isRequired,
    onPress: PropTypes.func.isRequired,
    onToggleStar: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    formatDate: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
    summaryItem: {
        flexDirection: "row",
        backgroundColor: COLORS.background,
        borderRadius: 8,
        marginBottom: SPACING.md,
        marginHorizontal: SPACING.xs, // Added horizontal margin
        padding: SPACING.lg, // Increased padding from md to lg
        width: "98%", // Set width to almost full width
        alignSelf: "center", // Center the item horizontally
        ...SHADOWS.medium, // Upgraded shadow for better visibility
    },
    thumbnail: {
        width: 100, // Increased from 80 to 100
        height: 75, // Increased from 60 to 75 to maintain aspect ratio
        borderRadius: 6, // Slightly increased border radius
        marginRight: SPACING.lg, // Increased spacing between thumbnail and content
    },
    summaryInfo: {
        flex: 1,
        justifyContent: "space-between",
        paddingVertical: SPACING.xs, // Added vertical padding
    },
    summaryTitle: {
        fontSize: FONT_SIZES.lg, // Increased font size from md to lg
        fontWeight: "600", // Increased font weight from 500 to 600
        color: COLORS.text,
        marginBottom: SPACING.sm, // Increased bottom margin
    },
    summaryDate: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm, // Increased bottom margin
    },
    summaryTypeContainer: {
        flexDirection: "row",
    },
    badge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: 6, // Increased from 4 to 6
        marginRight: SPACING.sm, // Increased from xs to sm
        marginTop: SPACING.xs, // Added top margin
    },
    typeBadge: {
        backgroundColor: COLORS.primary + "30", // Increased opacity from 20% to 30%
    },
    lengthBadge: {
        backgroundColor: COLORS.secondary + "30", // Increased opacity from 20% to 30%
    },
    badgeText: {
        fontSize: FONT_SIZES.sm, // Increased from xs to sm
        fontWeight: "500", // Added font weight
        color: COLORS.text,
    },
    actionsContainer: {
        justifyContent: "space-between",
        paddingLeft: SPACING.md, // Increased from sm to md
        marginLeft: SPACING.sm, // Added left margin
    },
    actionButton: {
        padding: SPACING.sm, // Increased from xs to sm
        marginVertical: SPACING.sm, // Added vertical margin
    },
});

export default React.memo(HistoryItem);
