import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for managing filters in the history screen
 * 
 * @param {Array} summaries - Array of summaries
 * @param {string} searchQuery - Current search query
 * @returns {Object} Filter state and filtered summaries
 * @returns {boolean} showStarredOnly - Whether to show only starred summaries
 * @returns {Function} setShowStarredOnly - Function to update starred filter
 * @returns {Array} filteredSummaries - Filtered summaries based on search and star filter
 */
const useHistoryFilters = (summaries, searchQuery) => {
  const [showStarredOnly, setShowStarredOnly] = useState(false);

  // Filter summaries based on search query and star filter
  const filteredSummaries = useMemo(() => {
    return summaries.filter((summary) => {
      // Apply star filter
      if (showStarredOnly && !summary.is_starred) {
        return false;
      }

      // Apply search filter if there's a query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        return (
          (summary.video_title &&
            summary.video_title.toLowerCase().includes(query)) ||
          (summary.summary_text &&
            summary.summary_text.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [summaries, searchQuery, showStarredOnly]);

  return {
    showStarredOnly,
    setShowStarredOnly,
    filteredSummaries,
  };
};

export default useHistoryFilters;
