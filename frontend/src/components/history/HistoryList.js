import React, { useCallback } from "react";
import { StyleSheet, FlatList, RefreshControl } from "react-native";
import PropTypes from "prop-types";
import { SPACING } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

// Import components
import HistoryItem from "./HistoryItem";
import PaginationControls from "./PaginationControls";
import EmptyState from "./EmptyState";

/**
 * HistoryList component for the History screen
 *
 * @param {Object} props - Component props
 * @param {Array} props.summaries - Array of summaries to display
 * @param {boolean} props.isLoading - Whether summaries are loading
 * @param {boolean} props.isRefreshing - Whether the list is refreshing
 * @param {boolean} props.isLoadingMore - Whether more items are being loaded
 * @param {string|null} props.error - Error message if any
 * @param {Object} props.pagination - Pagination state
 * @param {string} props.searchQuery - Current search query
 * @param {Array} props.allSummaries - Array of all summaries (before filtering)
 * @param {Function} props.onRefresh - Function to handle refreshing the list
 * @param {Function} props.onLoadMore - Function to handle loading more items
 * @param {Function} props.onPressItem - Function to handle pressing an item
 * @param {Function} props.onToggleStar - Function to handle toggling the star status
 * @param {Function} props.onDelete - Function to handle deleting an item
 * @param {Function} props.onClearSearch - Function to handle clearing the search
 * @param {Function} props.onCreateNew - Function to handle creating a new summary
 * @param {Function} props.formatDate - Function to format the date
 * @returns {React.ReactElement} HistoryList component
 */
const HistoryList = ({
    summaries,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    pagination,
    searchQuery,
    allSummaries,
    onRefresh,
    onLoadMore,
    onPressItem,
    onToggleStar,
    onDelete,
    onClearSearch,
    onCreateNew,
    formatDate,
}) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        listContent: {
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.xs, // Reduced horizontal padding to accommodate wider items
            flexGrow: 1,
        },
    }));
    // Render item
    const renderItem = useCallback(
        ({ item }) => (
            <HistoryItem
                item={item}
                onPress={onPressItem}
                onToggleStar={onToggleStar}
                onDelete={onDelete}
                formatDate={formatDate}
            />
        ),
        [onPressItem, onToggleStar, onDelete, formatDate]
    );

    // Key extractor
    const keyExtractor = useCallback((item) => item.id, []);

    // Render empty component
    const renderEmptyComponent = useCallback(
        () => (
            <EmptyState
                isLoading={isLoading}
                error={error}
                onRetry={onRefresh}
                searchQuery={searchQuery}
                onClearSearch={onClearSearch}
                summaries={allSummaries}
                onCreateNew={onCreateNew}
            />
        ),
        [
            isLoading,
            error,
            onRefresh,
            searchQuery,
            onClearSearch,
            allSummaries,
            onCreateNew,
        ]
    );

    // Render footer component
    const renderFooterComponent = useCallback(
        () => (
            <PaginationControls
                pagination={pagination}
                isLoadingMore={isLoadingMore}
                onLoadMore={onLoadMore}
            />
        ),
        [pagination, isLoadingMore, onLoadMore]
    );

    return (
        <FlatList
            data={summaries}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyComponent}
            ListFooterComponent={renderFooterComponent}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.3}
            refreshControl={
                <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={onRefresh}
                    colors={[colors.primary]}
                    tintColor={colors.primary}
                />
            }
        />
    );
};

HistoryList.propTypes = {
    summaries: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired,
    isRefreshing: PropTypes.bool.isRequired,
    isLoadingMore: PropTypes.bool.isRequired,
    error: PropTypes.string,
    pagination: PropTypes.object.isRequired,
    searchQuery: PropTypes.string.isRequired,
    allSummaries: PropTypes.array.isRequired,
    onRefresh: PropTypes.func.isRequired,
    onLoadMore: PropTypes.func.isRequired,
    onPressItem: PropTypes.func.isRequired,
    onToggleStar: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onClearSearch: PropTypes.func.isRequired,
    onCreateNew: PropTypes.func.isRequired,
    formatDate: PropTypes.func.isRequired,
};

export default React.memo(HistoryList);
