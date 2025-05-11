import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

/**
 * PaginationControls component for the History screen
 * 
 * @param {Object} props - Component props
 * @param {Object} props.pagination - Pagination state
 * @param {boolean} props.isLoadingMore - Whether more items are being loaded
 * @param {Function} props.onLoadMore - Function to handle loading more items
 * @returns {React.ReactElement} PaginationControls component
 */
const PaginationControls = ({ pagination, isLoadingMore, onLoadMore }) => {
  if (!pagination.has_next) return null;

  return (
    <View style={styles.footerContainer}>
      {isLoadingMore ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={onLoadMore}
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

PaginationControls.propTypes = {
  pagination: PropTypes.shape({
    page: PropTypes.number.isRequired,
    total_pages: PropTypes.number.isRequired,
    has_next: PropTypes.bool.isRequired,
  }).isRequired,
  isLoadingMore: PropTypes.bool.isRequired,
  onLoadMore: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  footerContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  loadMoreButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.sm,
  },
  loadMoreButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
  },
  paginationInfo: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});

export default React.memo(PaginationControls);
