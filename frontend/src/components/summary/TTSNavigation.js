import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";

import { COLORS, SPACING, FONT_SIZES } from "../../constants";

/**
 * TTSNavigation component displays navigation controls for TTS playback
 * 
 * @param {Object} props
 * @param {boolean} props.visible - Whether the navigation controls are visible
 * @param {number} props.currentSentence - The index of the current sentence being spoken
 * @param {Object} props.processedText - The processed text object with sentences array
 * @param {Function} props.onPrevSentence - Function to handle navigating to the previous sentence
 * @param {Function} props.onNextSentence - Function to handle navigating to the next sentence
 */
const TTSNavigation = ({
  visible,
  currentSentence,
  processedText,
  onPrevSentence,
  onNextSentence,
}) => {
  if (!visible || !processedText) return null;

  const isFirstSentence = currentSentence === 0;
  const isLastSentence = currentSentence === processedText.sentences.length - 1;

  return (
    <View style={styles.ttsNavigationContainer}>
      <TouchableOpacity
        style={[
          styles.ttsNavButton,
          isFirstSentence && styles.ttsNavButtonDisabled,
        ]}
        onPress={onPrevSentence}
        disabled={isFirstSentence}
      >
        <Ionicons
          name="arrow-back"
          size={24}
          color={
            isFirstSentence
              ? COLORS.textSecondary
              : COLORS.primary
          }
        />
        <Text style={styles.ttsNavButtonText}>Previous</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.ttsNavButton,
          isLastSentence && styles.ttsNavButtonDisabled,
        ]}
        onPress={onNextSentence}
        disabled={isLastSentence}
      >
        <Ionicons
          name="arrow-forward"
          size={24}
          color={
            isLastSentence
              ? COLORS.textSecondary
              : COLORS.primary
          }
        />
        <Text style={styles.ttsNavButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

TTSNavigation.propTypes = {
  visible: PropTypes.bool.isRequired,
  currentSentence: PropTypes.number.isRequired,
  processedText: PropTypes.shape({
    sentences: PropTypes.array.isRequired,
  }),
  onPrevSentence: PropTypes.func.isRequired,
  onNextSentence: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  ttsNavigationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  ttsNavButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.md,
    flex: 1,
  },
  ttsNavButtonDisabled: {
    opacity: 0.5,
  },
  ttsNavButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
});

export default TTSNavigation;
