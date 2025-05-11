import React from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

import { COLORS, SPACING, FONT_SIZES } from '../../constants';

/**
 * VideoInput component for entering YouTube URLs
 * 
 * @param {Object} props - Component props
 * @param {string} props.url - The current URL value
 * @param {boolean} props.isValidUrl - Whether the URL is valid
 * @param {Function} props.onUrlChange - Function to handle URL changes
 * @param {Function} props.onPasteFromClipboard - Function to handle pasting from clipboard
 * @returns {React.ReactElement} VideoInput component
 */
const VideoInput = ({ 
  url, 
  isValidUrl, 
  onUrlChange, 
  onPasteFromClipboard 
}) => {
  return (
    <View style={styles.inputContainer}>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            !isValidUrl && styles.inputError,
          ]}
          placeholder="Paste YouTube URL here"
          value={url}
          onChangeText={onUrlChange}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <TouchableOpacity
          style={styles.pasteButton}
          onPress={onPasteFromClipboard}
          accessibilityLabel="Paste from clipboard"
          accessibilityHint="Pastes YouTube URL from clipboard"
        >
          <Ionicons
            name="clipboard-outline"
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>
      {!isValidUrl && (
        <Text style={styles.errorText}>
          Please enter a valid YouTube URL
        </Text>
      )}
    </View>
  );
};

VideoInput.propTypes = {
  url: PropTypes.string.isRequired,
  isValidUrl: PropTypes.bool.isRequired,
  onUrlChange: PropTypes.func.isRequired,
  onPasteFromClipboard: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.md,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  pasteButton: {
    marginLeft: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
});

export default React.memo(VideoInput);
