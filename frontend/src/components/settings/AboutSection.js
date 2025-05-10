import React from "react";
import { StyleSheet, View, Text } from "react-native";
import PropTypes from "prop-types";
import { COLORS, SPACING, FONT_SIZES } from "../../constants";

/**
 * AboutSection component displays app information
 */
const AboutSection = ({ version, copyright }) => {
  return (
    <View style={styles.aboutSection}>
      <Text style={styles.aboutTitle}>About</Text>
      <Text style={styles.aboutText}>
        YouTube Summarizer v{version}
      </Text>
      <Text style={styles.aboutText}>
        Powered by Gemini 2.0 Flash-Lite AI
      </Text>
      <Text style={styles.aboutText}>{copyright}</Text>
    </View>
  );
};

AboutSection.propTypes = {
  version: PropTypes.string.isRequired,
  copyright: PropTypes.string.isRequired,
};

const styles = StyleSheet.create({
  aboutSection: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: "center",
  },
  aboutTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  aboutText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
});

export default AboutSection;
