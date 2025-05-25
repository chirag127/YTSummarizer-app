import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";

import { SPACING, FONT_SIZES, SUMMARY_TYPES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * SummaryTypeSelector component for selecting the type of summary to generate
 *
 * @param {Object} props - Component props
 * @param {string} props.summaryType - The currently selected summary type
 * @param {Function} props.onSummaryTypeChange - Function to handle summary type changes
 * @returns {React.ReactElement} SummaryTypeSelector component
 */
const SummaryTypeSelector = ({ summaryType, onSummaryTypeChange }) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        optionsContainer: {
            marginBottom: SPACING.md,
        },
        optionsLabel: {
            fontSize: FONT_SIZES.md,
            fontWeight: "500",
            color: colors.text,
            marginBottom: SPACING.sm,
        },
        optionsButtonGroup: {
            flexDirection: "row",
            flexWrap: "wrap",
        },
        optionButton: {
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.md,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            marginRight: SPACING.sm,
            marginBottom: SPACING.sm,
            backgroundColor: colors.surface,
        },
        optionButtonSelected: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        optionButtonText: {
            fontSize: FONT_SIZES.sm,
            color: colors.text,
        },
        optionButtonTextSelected: {
            color: colors.background,
        },
    }));

    return (
        <View style={styles.optionsContainer}>
            <Text style={styles.optionsLabel}>Summary Type:</Text>
            <View style={styles.optionsButtonGroup}>
                {SUMMARY_TYPES.map((type) => (
                    <TouchableOpacity
                        key={type.id}
                        style={[
                            styles.optionButton,
                            summaryType === type.id &&
                                styles.optionButtonSelected,
                        ]}
                        onPress={() => onSummaryTypeChange(type.id)}
                    >
                        <Text
                            style={[
                                styles.optionButtonText,
                                summaryType === type.id &&
                                    styles.optionButtonTextSelected,
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

export default React.memo(SummaryTypeSelector);
