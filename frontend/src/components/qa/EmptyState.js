import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

/**
 * Component to display when there are no messages in the chat
 * 
 * @returns {React.ReactElement} EmptyState component
 */
const EmptyState = () => {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        Ask a question about the video content
      </Text>
      <Text style={styles.emptySubtext}>
        The AI will answer based on the video transcript
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    opacity: 0.8,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default EmptyState;
