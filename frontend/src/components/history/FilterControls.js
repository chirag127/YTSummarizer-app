import React from "react";
import { View, Text, Switch } from "react-native";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * FilterControls component for the History screen
 *
 * @param {Object} props - Component props
 * @param {boolean} props.showStarredOnly - Whether to show only starred summaries
 * @param {Function} props.onToggleStarredFilter - Function to handle toggling the starred filter
 * @returns {React.ReactElement} FilterControls component
 */
const FilterControls = ({ showStarredOnly, onToggleStarredFilter }) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        filterContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: SPACING.md,
            backgroundColor: colors.surface,
            borderRadius: 8,
            padding: SPACING.md,
        },
        filterLabel: {
            fontSize: FONT_SIZES.md,
            color: colors.text,
        },
    }));

    return (
        <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Show Starred Only</Text>
            <Switch
                value={showStarredOnly}
                onValueChange={onToggleStarredFilter}
                trackColor={{
                    false: colors.disabled,
                    true: colors.primary,
                }}
                thumbColor={colors.background}
            />
        </View>
    );
};

FilterControls.propTypes = {
    showStarredOnly: PropTypes.bool.isRequired,
    onToggleStarredFilter: PropTypes.func.isRequired,
};

export default React.memo(FilterControls);
