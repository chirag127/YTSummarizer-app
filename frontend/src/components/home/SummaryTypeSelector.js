import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import PropTypes from 'prop-types';

import { COLORS, SPACING, FONT_SIZES, SUMMARY_TYPES } from '../../constants';

/**
 * SummaryTypeSelector component for selecting the type of summary to generate
 * 
 * @param {Object} props - Component props
 * @param {string} props.summaryType - The currently selected summary type
 * @param {Function} props.onSummaryTypeChange - Function to handle summary type changes
 * @returns {React.ReactElement} SummaryTypeSelector component
 */
const SummaryTypeSelector = ({ summaryType, onSummaryTypeChange }) => {
  return (
    <View style={styles.optionsContainer}>
      <Text style={styles.optionsLabel}>Summary Type:</Text>
      <View style={styles.optionsButtonGroup}>
        {SUMMARY_TYPES.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.optionButton,
              summaryType === type.id && styles.optionButtonSelected,
            ]}
            onPress={() => onSummaryTypeChange(type.id)}
          >
            <Text
              style={[
                styles.optionButtonText,
                summaryType === type.id && styles.optionButtonTextSelected,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

SummaryTypeSelector.propTypes = {
  summaryType: PropTypes.string.isRequired,
  onSummaryTypeChange: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  optionsContainer: {
    marginBottom: SPACING.md,
  },
  optionsLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  optionsButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
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

export default React.memo(SummaryTypeSelector);
