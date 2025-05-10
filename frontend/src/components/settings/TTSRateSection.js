import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";
import Slider from "@react-native-community/slider";
import { COLORS, SPACING, FONT_SIZES, TTS_RATE_OPTIONS } from "../../constants";

/**
 * TTSRateSection component controls the speech rate for text-to-speech
 */
const TTSRateSection = ({ rate, onRateChange }) => {
  // Find the closest preset rate option for visual feedback
  const getClosestRateLabel = (rate) => {
    // Find the closest rate option
    const closest = TTS_RATE_OPTIONS.reduce((prev, curr) => {
      return Math.abs(curr.value - rate) < Math.abs(prev.value - rate)
        ? curr
        : prev;
    });
    return closest.label;
  };

  // Calculate the color for the rate indicator based on the current rate
  const getRateColor = (rate) => {
    // Normalize the rate between 0 and 1 for color interpolation
    // Assuming min rate is 0.5 and max rate is 16.0
    const normalizedRate = Math.min(
      Math.max((rate - 0.5) / 15.5, 0),
      1
    );

    // Interpolate between blue (slow) and red (fast)
    const r = Math.round(normalizedRate * 255);
    const g = Math.round(50 + (1 - normalizedRate) * 100);
    const b = Math.round(255 - normalizedRate * 255);

    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <View style={styles.settingSection}>
      <Text style={styles.settingTitle}>Speech Rate</Text>
      <Text style={styles.settingDescription}>
        Adjust how fast the text is read aloud
      </Text>

      <View style={styles.sliderContainer}>
        <View style={styles.sliderLabelsContainer}>
          <Text style={styles.sliderLabel}>Slow</Text>
          <View style={styles.currentRateContainer}>
            <Text
              style={[
                styles.currentRateValue,
                { color: getRateColor(rate) },
              ]}
            >
              {rate.toFixed(2)}x
            </Text>
            <Text style={styles.currentRateLabel}>
              {getClosestRateLabel(rate)}
            </Text>
          </View>
          <Text style={styles.sliderLabel}>Fast</Text>
        </View>

        <Slider
          style={styles.slider}
          minimumValue={0.5}
          maximumValue={16.0}
          step={0.1}
          value={rate}
          onValueChange={(value) => onRateChange(value, false)}
          onSlidingComplete={(value) => onRateChange(value, true)}
          minimumTrackTintColor={getRateColor(rate)}
          maximumTrackTintColor={COLORS.border}
          thumbTintColor={getRateColor(rate)}
        />

        <View style={styles.presetButtonsContainer}>
          {[0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 6.0].map((presetRate) => (
            <TouchableOpacity
              key={presetRate}
              style={[
                styles.presetButton,
                Math.abs(rate - presetRate) < 0.1 &&
                  styles.presetButtonSelected,
              ]}
              onPress={() => onRateChange(presetRate, true)}
            >
              <Text
                style={[
                  styles.presetButtonText,
                  Math.abs(rate - presetRate) < 0.1 &&
                    styles.presetButtonTextSelected,
                ]}
              >
                {presetRate.toFixed(1)}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

TTSRateSection.propTypes = {
  rate: PropTypes.number.isRequired,
  onRateChange: PropTypes.func.isRequired,
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
  sliderContainer: {
    marginTop: SPACING.sm,
  },
  sliderLabelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  sliderLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  currentRateContainer: {
    alignItems: "center",
  },
  currentRateValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "bold",
  },
  currentRateLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  presetButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: SPACING.sm,
  },
  presetButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  presetButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  presetButtonText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
  },
  presetButtonTextSelected: {
    color: COLORS.background,
  },
});

export default TTSRateSection;
