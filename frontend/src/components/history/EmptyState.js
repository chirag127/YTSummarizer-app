import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * EmptyState component for the History screen
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Whether summaries are loading
 * @param {string|null} props.error - Error message if any
 * @param {Function} props.onRetry - Function to handle retry
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.onClearSearch - Function to handle clearing the search
 * @param {Array} props.summaries - Array of all summaries (before filtering)
 * @param {Function} props.onCreateNew - Function to handle creating a new summary
 * @returns {React.ReactElement} EmptyState component
 */
const EmptyState = ({
    isLoading,
    error,
    onRetry,
    searchQuery,
    onClearSearch,
    summaries,
    onCreateNew,
}) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        emptyContainer: {
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: SPACING.xl,
        },
        emptyText: {
            fontSize: FONT_SIZES.lg,
            fontWeight: "500",
            color: colors.text,
            marginTop: SPACING.md,
            textAlign: "center",
        },
        emptySubtext: {
            fontSize: FONT_SIZES.md,
            color: colors.textSecondary,
            marginTop: SPACING.sm,
            textAlign: "center",
        },
        retryButton: {
            backgroundColor: colors.primary,
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.sm,
            borderRadius: 8,
            marginTop: SPACING.lg,
        },
        retryButtonText: {
            color: colors.background,
            fontSize: FONT_SIZES.md,
            fontWeight: "500",
        },
        emptyButtonsContainer: {
            flexDirection: "row",
            marginTop: SPACING.lg,
        },
        reloadButton: {
            backgroundColor: colors.primary,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            borderRadius: 8,
            marginRight: SPACING.md,
            flexDirection: "row",
            alignItems: "center",
        },
        reloadButtonText: {
            color: colors.background,
            fontSize: FONT_SIZES.md,
            fontWeight: "500",
            marginLeft: SPACING.xs,
        },
        newSummaryButton: {
            backgroundColor: colors.secondary,
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.sm,
            borderRadius: 8,
        },
        newSummaryButtonText: {
            color: colors.background,
            fontSize: FONT_SIZES.md,
            fontWeight: "500",
        },
    }));

    if (isLoading) {
        return (
            <View style={styles.emptyContainer}>
                <ActivityIndicator size={36} color={colors.primary} />
                <Text style={styles.emptyText}>Loading summaries...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons
                    name="alert-circle-outline"
                    size={48}
                    color={colors.error}
                />
                <Text style={styles.emptyText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                    <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // If we have summaries but none match the search query
    if (summaries.length > 0 && searchQuery.trim() !== "") {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons
                    name="search-outline"
                    size={48}
                    color={colors.textSecondary}
                />
                <Text style={styles.emptyText}>No matching summaries</Text>
                <Text style={styles.emptySubtext}>
                    No summaries match your search query
                </Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={onClearSearch}
                >
                    <Text style={styles.retryButtonText}>Clear Search</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.emptyContainer}>
            <Ionicons
                name="document-text-outline"
                size={48}
                color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No summaries yet</Text>
            <Text style={styles.emptySubtext}>
                Summaries you generate will appear here
            </Text>
            <View style={styles.emptyButtonsContainer}>
                <TouchableOpacity style={styles.reloadButton} onPress={onRetry}>
                    <Ionicons
                        name="refresh-outline"
                        size={20}
                        color={colors.background}
                    />
                    <Text style={styles.reloadButtonText}>Reload</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.newSummaryButton}
                    onPress={onCreateNew}
                >
                    <Text style={styles.newSummaryButtonText}>
                        Create New Summary
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

EmptyState.propTypes = {
    isLoading: PropTypes.bool.isRequired,
    error: PropTypes.string,
    onRetry: PropTypes.func.isRequired,
    searchQuery: PropTypes.string.isRequired,
    onClearSearch: PropTypes.func.isRequired,
    summaries: PropTypes.array.isRequired,
    onCreateNew: PropTypes.func.isRequired,
};

export default React.memo(EmptyState);
