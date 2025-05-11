import { useCallback } from "react";

/**
 * Custom hook for managing pagination in the history screen
 *
 * @param {Object} options - Options object
 * @param {Object} options.pagination - Pagination state object
 * @param {boolean} options.isLoadingMore - Whether more items are being loaded
 * @param {Function} options.fetchSummaries - Function to fetch summaries
 * @returns {Object} Pagination functions
 * @returns {Function} loadMoreSummaries - Function to load more summaries
 */
const useHistoryPagination = ({
    pagination,
    isLoadingMore,
    fetchSummaries,
}) => {
    // Load more summaries
    const loadMoreSummaries = useCallback(() => {
        if (pagination.has_next && !isLoadingMore) {
            fetchSummaries(false, pagination.page + 1);
        }
    }, [pagination.has_next, pagination.page, isLoadingMore, fetchSummaries]);

    return {
        loadMoreSummaries,
    };
};

export default useHistoryPagination;
