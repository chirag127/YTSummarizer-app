import React from 'react';
import { 
  StyleSheet, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';
import OfflineBanner from './OfflineBanner';

/**
 * Component for the input area of the QA screen
 * 
 * @param {Object} props - Component props
 * @param {string} props.inputText - Current text in the input field
 * @param {Function} props.onChangeText - Function to handle text change
 * @param {Function} props.onSend - Function to handle send button press
 * @param {boolean} props.isLoading - Whether the app is loading
 * @param {boolean} props.isOffline - Whether the app is offline
 * @param {Object} props.inputRef - Ref for the TextInput
 * @returns {React.ReactElement} InputArea component
 */
const InputArea = ({
  inputText,
  onChangeText,
  onSend,
  isLoading,
  isOffline,
  inputRef,
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 80}
      style={styles.keyboardAvoidingContainer}
    >
      <View style={styles.inputContainer}>
        {isOffline && <OfflineBanner />}
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputText}
          onChangeText={onChangeText}
          placeholder="Type your question..."
          placeholderTextColor={COLORS.textSecondary}
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={onSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons
            name="send"
            size={24}
            color={
              !inputText.trim() || isLoading
                ? COLORS.disabled
                : COLORS.primary
            }
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

InputArea.propTypes = {
  inputText: PropTypes.string.isRequired,
  onChangeText: PropTypes.func.isRequired,
  onSend: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isOffline: PropTypes.bool.isRequired,
  inputRef: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  keyboardAvoidingContainer: {
    width: '100%',
    backgroundColor: COLORS.background,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.lg, // Add extra padding at the bottom for iOS
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default InputArea;
