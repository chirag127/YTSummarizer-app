import { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

// Import components, services, and utilities
import {
    getAllSummaries,
    deleteSummary,
    toggleStarSummary,
} from "../services/api";
import { SPACING, SCREENS } from "../constants";
import { useTimeZone } from "../context/TimeZoneContext";
import { useTheme } from "../context/ThemeContext";
import useThemedStyles from "../hooks/useThemedStyles";

// Import custom hooks
import useHistoryPagination from "../hooks/useHistoryPagination";
import useHistorySearch from "../hooks/useHistorySearch";
import useHistoryFilters from "../hooks/useHistoryFilters";

// Import components
import { SearchBar, FilterControls, HistoryList } from "../components/history";

const HistoryScreen = ({ navigation }) => {
    // Get theme colors
    const { colors } = useTheme();

    // State
    const [summaries, setSummaries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 100,
        total_count: 0,
        total_pages: 0,
        has_next: false,
        has_prev: false,
    });

    // Get time zone context
    const { formatDateWithTimeZone } = useTimeZone();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        container: {
            flex: 1,
            backgroundColor: colors.background,
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.xs, // Reduced horizontal padding to accommodate wider items
        },
    }));

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

    // Custom hooks
    const { loadMoreSummaries } = useHistoryPagination({
        pagination,
        isLoadingMore,
        fetchSummaries,
    });

    const { searchQuery, handleSearchChange, handleClearSearch } =
        useHistorySearch();

    const { showStarredOnly, setShowStarredOnly, filteredSummaries } =
        useHistoryFilters(summaries, searchQuery);

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
    const handleRefresh = useCallback(() => {
        // Reset to page 1 when refreshing
        setPagination((prev) => ({ ...prev, page: 1 }));
        // Clear search query when refreshing
        handleClearSearch();
        fetchSummaries(true, 1);
    }, [setPagination, handleClearSearch, fetchSummaries]);

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
            // Call API to toggle star status
            await toggleStarSummary(id, newStarredStatus);

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

    // Note: Rendering is now handled by the modular components

    // Note: Search functionality is now handled by the useHistorySearch hook

    // Handle press item
    const handlePressItem = useCallback(
        (item) => {
            navigation.navigate(SCREENS.SUMMARY, { summary: item });
        },
        [navigation]
    );

    // Handle create new
    const handleCreateNew = useCallback(() => {
        navigation.navigate("HomeTab");
    }, [navigation]);

    return (
        <View style={styles.container}>
            <FilterControls
                showStarredOnly={showStarredOnly}
                onToggleStarredFilter={setShowStarredOnly}
            />

            <SearchBar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onClearSearch={handleClearSearch}
            />

            <HistoryList
                summaries={filteredSummaries}
                isLoading={isLoading}
                isRefreshing={isRefreshing}
                isLoadingMore={isLoadingMore}
                error={error}
                pagination={pagination}
                searchQuery={searchQuery}
                allSummaries={summaries}
                onRefresh={handleRefresh}
                onLoadMore={loadMoreSummaries}
                onPressItem={handlePressItem}
                onToggleStar={handleToggleStar}
                onDelete={handleDelete}
                onClearSearch={handleClearSearch}
                onCreateNew={handleCreateNew}
                formatDate={formatDateWithTimeZone}
            />
        </View>
    );
};

export default HistoryScreen;
