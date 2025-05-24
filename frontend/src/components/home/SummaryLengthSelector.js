import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES, SUMMARY_LENGTHS } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * SummaryLengthSelector component for selecting the length of summary to generate
 *
 * @param {Object} props - Component props
 * @param {string} props.summaryLength - The currently selected summary length
 * @param {Function} props.onSummaryLengthChange - Function to handle summary length changes
 * @returns {React.ReactElement} SummaryLengthSelector component
 */
const SummaryLengthSelector = ({ summaryLength, onSummaryLengthChange }) => {
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
            <Text style={styles.optionsLabel}>Summary Length:</Text>
            <View style={styles.optionsButtonGroup}>
                {SUMMARY_LENGTHS.map((length) => (
                    <TouchableOpacity
                        key={length.id}
                        style={[
                            styles.optionButton,
                            summaryLength === length.id &&
                                styles.optionButtonSelected,
                        ]}
                        onPress={() => onSummaryLengthChange(length.id)}
                    >
                        <Text
                            style={[
                                styles.optionButtonText,
                                summaryLength === length.id &&
                                    styles.optionButtonTextSelected,
                            ]}
                        >
                            {length.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

SummaryLengthSelector.propTypes = {
    summaryLength: PropTypes.string.isRequired,
    onSummaryLengthChange: PropTypes.func.isRequired,
};

export default React.memo(SummaryLengthSelector);
