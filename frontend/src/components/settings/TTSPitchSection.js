import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";
import { COLORS, SPACING, FONT_SIZES, TTS_PITCH_OPTIONS } from "../../constants";

/**
 * TTSPitchSection component controls the pitch for text-to-speech
 */
const TTSPitchSection = ({ pitch, onPitchChange }) => {
  return (
    <View style={styles.settingSection}>
      <Text style={styles.settingTitle}>Speech Pitch</Text>
      <Text style={styles.settingDescription}>
        Adjust the pitch of the voice
      </Text>
      <View style={styles.optionsContainer}>
        {TTS_PITCH_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              pitch === option.value &&
                styles.optionButtonSelected,
            ]}
            onPress={() => onPitchChange(option.value)}
          >
            <Text
              style={[
                styles.optionButtonText,
                pitch === option.value &&
                  styles.optionButtonTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

TTSPitchSection.propTypes = {
  pitch: PropTypes.number.isRequired,
  onPitchChange: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  settingSection: {
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
  },
  settingTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  optionButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  optionButtonTextSelected: {
    color: COLORS.background,
  },
});

export default TTSPitchSection;
