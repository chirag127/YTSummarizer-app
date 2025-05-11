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
            <View style={styles.topContainer}>
                <Image
                    source={{
                        uri:
                            item.video_thumbnail_url ||
                            "https://via.placeholder.com/480x360?text=No+Thumbnail",
                    }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                />
                <View style={styles.metadataContainer}>
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
            </View>
            <Text style={styles.summaryTitle} numberOfLines={3}>
                {item.video_title || "Untitled Video"}
            </Text>
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
        flexDirection: "column", // Changed from row to column
        backgroundColor: COLORS.background,
        borderRadius: 8,
        marginBottom: SPACING.md,
        marginHorizontal: SPACING.xs,
        padding: SPACING.lg,
        width: "98%",
        alignSelf: "center",
        ...SHADOWS.medium,
    },
    topContainer: {
        flexDirection: "row", // This row contains thumbnail, metadata, and actions
        marginBottom: SPACING.md, // Add space between top container and title
    },
    thumbnail: {
        width: 100,
        height: 75,
        borderRadius: 6,
        marginRight: SPACING.md,
    },
    metadataContainer: {
        flex: 1, // Take available space
        justifyContent: "center", // Center content vertically
    },
    summaryTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: "600",
        color: COLORS.text,
        lineHeight: FONT_SIZES.lg * 1.3,
        marginTop: SPACING.xs, // Add space above title
    },
    summaryDate: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs, // Reduced margin
    },
    summaryTypeContainer: {
        flexDirection: "row",
        marginTop: SPACING.xs, // Added top margin
    },
    badge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs / 2, // Reduced vertical padding for more compact badges
        borderRadius: 6,
        marginRight: SPACING.sm,
    },
    typeBadge: {
        backgroundColor: COLORS.primary + "30", // Increased opacity from 20% to 30%
    },
    lengthBadge: {
        backgroundColor: COLORS.secondary + "30", // Increased opacity from 20% to 30%
    },
    badgeText: {
        fontSize: FONT_SIZES.xs, // Changed back to xs for more compact badges
        fontWeight: "500",
        color: COLORS.text,
    },
    actionsContainer: {
        justifyContent: "space-between",
        paddingLeft: SPACING.sm,
        marginLeft: SPACING.xs,
    },
    actionButton: {
        padding: SPACING.xs,
        marginVertical: SPACING.xs,
    },
});

export default React.memo(HistoryItem);
