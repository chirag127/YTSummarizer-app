import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

/**
 * Component to display when no transcript is available
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onRetry - Function to handle retry button press
 * @returns {React.ReactElement} NoTranscriptError component
 */
const NoTranscriptError = ({ onRetry }) => {
  return (
    <View style={styles.centerContainer}>
      <Ionicons
        name="alert-circle-outline"
        size={48}
        color={COLORS.error}
      />
      <Text style={styles.errorText}>
        This video does not have a transcript available.
      </Text>
      <Text style={styles.errorSubtext}>
        The Q&A feature requires a video transcript to function.
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
      >
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

NoTranscriptError.propTypes = {
  onRetry: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
    textAlign: 'center',
    marginVertical: SPACING.md,
  },
  errorSubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
    marginTop: SPACING.lg,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
});

export default NoTranscriptError;
