import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

/**
 * Component to display an error message with retry option
 * 
 * @param {Object} props - Component props
 * @param {Object} props.error - Error object with message
 * @param {Function} props.onRetry - Function to handle retry button press
 * @param {boolean} props.isRetrying - Whether the app is retrying
 * @returns {React.ReactElement} ErrorDisplay component
 */
const ErrorDisplay = ({ error, onRetry, isRetrying }) => {
  return (
    <View style={styles.errorBanner}>
      <View style={styles.errorContent}>
        <Ionicons
          name="alert-circle-outline"
          size={20}
          color={COLORS.error}
        />
        <Text style={styles.errorMessage}>{error.message}</Text>
      </View>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        disabled={isRetrying}
      >
        {isRetrying ? (
          <ActivityIndicator size="small" color={COLORS.background} />
        ) : (
          <Text style={styles.retryButtonText}>Retry</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

ErrorDisplay.propTypes = {
  error: PropTypes.shape({
    message: PropTypes.string.isRequired,
    type: PropTypes.string,
  }).isRequired,
  onRetry: PropTypes.func.isRequired,
  isRetrying: PropTypes.bool.isRequired,
};

const styles = StyleSheet.create({
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.error + '20', // 20% opacity
    padding: SPACING.sm,
    borderRadius: 8,
    margin: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  errorMessage: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  retryButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
    marginLeft: SPACING.sm,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
});

export default ErrorDisplay;
