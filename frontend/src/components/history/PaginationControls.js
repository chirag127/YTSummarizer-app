import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

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
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        footerContainer: {
            alignItems: "center",
            paddingVertical: SPACING.md,
        },
        loadMoreButton: {
            backgroundColor: colors.primary,
            paddingHorizontal: SPACING.lg,
            paddingVertical: SPACING.sm,
            borderRadius: 8,
            marginBottom: SPACING.sm,
        },
        loadMoreButtonText: {
            color: colors.background,
            fontSize: FONT_SIZES.md,
            fontWeight: "500",
        },
        paginationInfo: {
            fontSize: FONT_SIZES.sm,
            color: colors.textSecondary,
        },
    }));

    if (!pagination.has_next) return null;

    return (
        <View style={styles.footerContainer}>
            {isLoadingMore ? (
                <ActivityIndicator size="small" color={colors.primary} />
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

export default React.memo(PaginationControls);
