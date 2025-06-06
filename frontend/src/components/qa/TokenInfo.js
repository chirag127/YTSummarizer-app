import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * Component to display token usage information
 *
 * @param {Object} props - Component props
 * @param {number} props.transcriptTokenCount - Number of tokens in the transcript
 * @param {number} props.tokenCount - Total token count for the conversation
 * @returns {React.ReactElement} TokenInfo component
 */
const TokenInfo = ({ transcriptTokenCount, tokenCount }) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        tokenCountsContainer: {
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
        },
        tokenCountContainer: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: SPACING.xs,
            borderRadius: 8,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: SPACING.xs,
            marginLeft: SPACING.sm,
            width: "100%",
        },
        tokenCountText: {
            fontSize: FONT_SIZES.xs,
            color: colors.textSecondary,
            marginLeft: SPACING.xs,
        },
    }));

    return (
        <View style={styles.tokenCountsContainer}>
            <View style={styles.tokenCountContainer}>
                <Ionicons
                    name="document-text-outline"
                    size={14}
                    color={colors.textSecondary}
                />
                <Text style={styles.tokenCountText}>
                    Transcript: {transcriptTokenCount.toLocaleString()}
                </Text>
            </View>
            <View style={styles.tokenCountContainer}>
                <Ionicons
                    name="chatbubble-outline"
                    size={14}
                    color={colors.textSecondary}
                />
                <Text style={styles.tokenCountText}>
                    Total: {tokenCount.toLocaleString()}
                </Text>
            </View>
        </View>
    );
};

TokenInfo.propTypes = {
    transcriptTokenCount: PropTypes.number.isRequired,
    tokenCount: PropTypes.number.isRequired,
};

export default TokenInfo;
