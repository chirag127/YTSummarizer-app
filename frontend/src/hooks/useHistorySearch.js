import { useState, useCallback } from 'react';

/**
 * Custom hook for managing search functionality in the history screen
 * 
 * @returns {Object} Search state and functions
 * @returns {string} searchQuery - Current search query
 * @returns {Function} handleSearchChange - Function to handle search input change
 * @returns {Function} handleClearSearch - Function to handle clearing the search
 */
const useHistorySearch = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Handle search input change
  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
  }, []);

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  return {
    searchQuery,
    handleSearchChange,
    handleClearSearch,
  };
};

export default useHistorySearch;
