import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

import { COLORS, SPACING, FONT_SIZES } from '../../constants';

/**
 * ActionButtons component for the HomeScreen
 * Displays either a loading indicator with cancel button or a generate summary button
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isLoading - Whether a summary is currently being generated
 * @param {number} props.elapsedTime - The elapsed time in seconds for the current generation
 * @param {Function} props.onSubmit - Function to handle generate summary button press
 * @param {Function} props.onCancel - Function to handle cancel button press
 * @returns {React.ReactElement} ActionButtons component
 */
const ActionButtons = ({ isLoading, elapsedTime, onSubmit, onCancel }) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingInfo}>
          <ActivityIndicator
            color={COLORS.primary}
            size="small"
          />
          <Text style={styles.loadingText}>
            Generating summary... {elapsedTime}s
          </Text>
        </View>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={COLORS.error}
          />
          <Text style={styles.cancelButtonText}>
            Stop
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={onSubmit}
    >
      <Ionicons
        name="document-text"
        size={20}
        color={COLORS.background}
      />
      <Text style={styles.buttonText}>
        Generate Summary
      </Text>
    </TouchableOpacity>
  );
};

ActionButtons.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  elapsedTime: PropTypes.number.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
  loadingContainer: {
    marginTop: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
  },
  loadingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  loadingText: {
    marginLeft: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.error,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
});

export default React.memo(ActionButtons);
