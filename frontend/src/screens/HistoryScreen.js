import React, { useState, useEffect, useCallback } from "react";
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

// Import components, services, and utilities
import {
    getAllSummaries,
    deleteSummary,
    toggleStarSummary,
} from "../services/api";
import { formatDate, truncateText } from "../utils";
import { COLORS, SPACING, FONT_SIZES, SCREENS, SHADOWS } from "../constants";

const HistoryScreen = ({ navigation }) => {
    // State
    const [summaries, setSummaries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [showStarredOnly, setShowStarredOnly] = useState(false);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 100,
        total_count: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
    });

    // Fetch summaries
    const fetchSummaries = async (showRefreshing = false, page = 1) => {
        if (showRefreshing) {
            setIsRefreshing(true);
        } else if (page === 1) {
            setIsLoading(true);
        } else {
            setIsLoadingMore(true);
        }

        setError(null);

        try {
            const data = await getAllSummaries(page, pagination.limit);

            if (page === 1) {
                // Replace all summaries when loading first page
                setSummaries(data.summaries);
            } else {
                // Append summaries when loading more pages
                setSummaries((prevSummaries) => [
                    ...prevSummaries,
                    ...data.summaries,
                ]);
            }

            // Update pagination info
            setPagination(data.pagination);
        } catch (error) {
            console.error("Error fetching summaries:", error);

            // Handle network errors more gracefully
            if (error.message === "Network Error") {
                setError(
                    "Network error. Unable to connect to the server. Please check your internet connection."
                );
            } else {
                setError("Failed to load summaries. Please try again.");
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
            setIsLoadingMore(false);
        }
    };

    // Load more summaries
    const loadMoreSummaries = () => {
        if (pagination.has_next && !isLoadingMore) {
            fetchSummaries(false, pagination.page + 1);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchSummaries();
    }, []);

    // Refresh when screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchSummaries();
        }, [])
    );

    // Handle refresh
    const handleRefresh = () => {
        // Reset to page 1 when refreshing
        setPagination((prev) => ({ ...prev, page: 1 }));
        fetchSummaries(true, 1);
    };

    // Handle delete
    const handleDelete = (id) => {
        Alert.alert(
            "Delete Summary",
            "Are you sure you want to delete this summary?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteSummary(id);
                            // Remove from state
                            setSummaries((prevSummaries) =>
                                prevSummaries.filter(
                                    (summary) => summary.id !== id
                                )
                            );
                        } catch (error) {
                            console.error("Error deleting summary:", error);

                            // Handle network errors more gracefully
                            if (error.message === "Network Error") {
                                // Still remove from local state even if network error
                                setSummaries((prevSummaries) =>
                                    prevSummaries.filter(
                                        (summary) => summary.id !== id
                                    )
                                );
                                Alert.alert(
                                    "Network Error",
                                    "Summary removed from local view, but may not be deleted from the server due to network issues."
                                );
                            } else {
                                Alert.alert(
                                    "Error",
                                    "Failed to delete summary."
                                );
                            }
                        }
                    },
                },
            ]
        );
    };

    // Handle star toggle
    const handleToggleStar = async (id, currentStarred) => {
        try {
            const newStarredStatus = !currentStarred;
            const updatedSummary = await toggleStarSummary(
                id,
                newStarredStatus
            );

            // Update the summaries state with the updated summary
            setSummaries((prevSummaries) =>
                prevSummaries.map((summary) =>
                    summary.id === id
                        ? { ...summary, is_starred: newStarredStatus }
                        : summary
                )
            );
        } catch (error) {
            console.error("Error toggling star status:", error);
            Alert.alert(
                "Error",
                "Failed to update star status. Please try again."
            );
        }
    };

    // Filtered summaries based on star filter
    const filteredSummaries = showStarredOnly
        ? summaries.filter((summary) => summary.is_starred)
        : summaries;

    // Render footer component (load more indicator)
    const renderFooter = () => {
        if (!pagination.has_next) return null;

        return (
            <View style={styles.footerContainer}>
                {isLoadingMore ? (
                    <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                    <TouchableOpacity
                        style={styles.loadMoreButton}
                        onPress={loadMoreSummaries}
                    >
                        <Text style={styles.loadMoreButtonText}>Load More</Text>
                    </TouchableOpacity>
                )}
                <Text style={styles.paginationInfo}>
                    Page {pagination.page} of {pagination.total_pages}
                </Text>
            </View>
        );
    };

    // Render summary item
    const renderSummaryItem = ({ item }) => {
        return (
            <TouchableOpacity
                style={styles.summaryItem}
                onPress={() =>
                    navigation.navigate(SCREENS.SUMMARY, { summary: item })
                }
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
                        onPress={() =>
                            handleToggleStar(item.id, item.is_starred)
                        }
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
                        onPress={() => handleDelete(item.id)}
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

    // Render empty state
    const renderEmptyState = () => {
        if (isLoading) {
            return (
                <View style={styles.emptyContainer}>
                    <ActivityIndicator size={36} color={COLORS.primary} />
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
                        color={COLORS.error}
                    />
                    <Text style={styles.emptyText}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => fetchSummaries()}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.emptyContainer}>
                <Ionicons
                    name="document-text-outline"
                    size={48}
                    color={COLORS.textSecondary}
                />
                <Text style={styles.emptyText}>No summaries yet</Text>
                <Text style={styles.emptySubtext}>
                    Summaries you generate will appear here
                </Text>
                <View style={styles.emptyButtonsContainer}>
                    <TouchableOpacity
                        style={styles.reloadButton}
                        onPress={() => fetchSummaries()}
                    >
                        <Ionicons
                            name="refresh-outline"
                            size={20}
                            color={COLORS.background}
                        />
                        <Text style={styles.reloadButtonText}>Reload</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.newSummaryButton}
                        onPress={() => navigation.navigate("HomeTab")}
                    >
                        <Text style={styles.newSummaryButtonText}>
                            Create New Summary
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Show Starred Only</Text>
                <Switch
                    value={showStarredOnly}
                    onValueChange={setShowStarredOnly}
                    trackColor={{
                        false: COLORS.disabled,
                        true: COLORS.primary,
                    }}
                    thumbColor={COLORS.background}
                />
            </View>
            <FlatList
                data={filteredSummaries}
                renderItem={renderSummaryItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmptyState}
                ListFooterComponent={renderFooter}
                onEndReached={loadMoreSummaries}
                onEndReachedThreshold={0.3}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    listContent: {
        padding: SPACING.md,
        flexGrow: 1,
    },
    summaryItem: {
        flexDirection: "row",
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        marginBottom: SPACING.md,
        overflow: "hidden",
        ...SHADOWS.small,
    },
    thumbnail: {
        width: 100,
        height: 80,
    },
    summaryInfo: {
        flex: 1,
        padding: SPACING.sm,
        justifyContent: "space-between",
    },
    summaryTitle: {
        fontSize: FONT_SIZES.md,
        fontWeight: "500",
        color: COLORS.text,
        marginBottom: 4,
    },
    summaryDate: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    summaryTypeContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
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
        backgroundColor: COLORS.primary,
    },
    lengthBadge: {
        backgroundColor: COLORS.secondary,
    },
    badgeText: {
        fontSize: FONT_SIZES.xs,
        color: "white",
        fontWeight: "500",
    },
    actionsContainer: {
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: SPACING.xs,
    },
    actionButton: {
        padding: SPACING.sm,
        justifyContent: "center",
        alignItems: "center",
    },
    filterContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    filterLabel: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        fontWeight: "500",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: SPACING.xl,
        minHeight: 300,
    },
    emptyText: {
        fontSize: FONT_SIZES.lg,
        color: COLORS.text,
        marginTop: SPACING.md,
        textAlign: "center",
    },
    emptySubtext: {
        fontSize: FONT_SIZES.md,
        color: COLORS.textSecondary,
        marginTop: SPACING.sm,
        textAlign: "center",
    },
    emptyButtonsContainer: {
        flexDirection: "row",
        marginTop: SPACING.lg,
        gap: SPACING.md,
    },
    newSummaryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        borderRadius: 8,
    },
    newSummaryButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.md,
        fontWeight: "600",
    },
    reloadButton: {
        backgroundColor: COLORS.secondary,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: SPACING.xs,
    },
    reloadButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.md,
        fontWeight: "600",
    },
    retryButton: {
        marginTop: SPACING.md,
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        borderRadius: 8,
    },
    retryButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.md,
        fontWeight: "600",
    },
    footerContainer: {
        padding: SPACING.md,
        alignItems: "center",
        justifyContent: "center",
    },
    loadMoreButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.lg,
        borderRadius: 8,
        marginBottom: SPACING.sm,
    },
    loadMoreButtonText: {
        color: COLORS.background,
        fontSize: FONT_SIZES.md,
        fontWeight: "600",
    },
    paginationInfo: {
        fontSize: FONT_SIZES.sm,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
});

export default HistoryScreen;
