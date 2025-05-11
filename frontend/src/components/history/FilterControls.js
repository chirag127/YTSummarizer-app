import React from 'react';
import { StyleSheet, View, Text, Switch } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

/**
 * FilterControls component for the History screen
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.showStarredOnly - Whether to show only starred summaries
 * @param {Function} props.onToggleStarredFilter - Function to handle toggling the starred filter
 * @returns {React.ReactElement} FilterControls component
 */
const FilterControls = ({ showStarredOnly, onToggleStarredFilter }) => {
  return (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>Show Starred Only</Text>
      <Switch
        value={showStarredOnly}
        onValueChange={onToggleStarredFilter}
        trackColor={{
          false: COLORS.disabled,
          true: COLORS.primary,
        }}
        thumbColor={COLORS.background}
      />
    </View>
  );
};

FilterControls.propTypes = {
  showStarredOnly: PropTypes.bool.isRequired,
  onToggleStarredFilter: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
  },
  filterLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
});

export default React.memo(FilterControls);
