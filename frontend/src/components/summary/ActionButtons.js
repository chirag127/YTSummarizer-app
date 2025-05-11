import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";

import { COLORS, SPACING, FONT_SIZES } from "../../constants";

/**
 * ActionButtons component displays the action buttons for the summary
 *
 * @param {Object} props
 * @param {boolean} props.isPlaying - Whether TTS is currently playing
 * @param {boolean} props.showPlainText - Whether to show plain text instead of markdown
 * @param {boolean} props.isLoading - Whether a summary is being generated/regenerated
 * @param {boolean} props.isStarred - Whether the summary is starred
 * @param {Function} props.onPlayPause - Function to handle play/pause TTS
 * @param {Function} props.onToggleTextFormat - Function to toggle between markdown and plain text
 * @param {Function} props.onShare - Function to handle sharing the summary
 * @param {Function} props.onCopy - Function to handle copying the summary to clipboard
 * @param {Function} props.onToggleStar - Function to handle toggling the star status
 * @param {Function} props.onRegenerate - Function to handle regenerating the summary
 * @param {Function} props.onNewType - Function to handle creating a new summary type
 * @param {Function} props.onAskAI - Function to handle navigating to the QA screen
 */
const ActionButtons = ({
    isPlaying,
    showPlainText,
    isLoading,
    isStarred,
    onPlayPause,
    onToggleTextFormat,
    onShare,
    onCopy,
    onToggleStar,
    onRegenerate,
    onNewType,
    onAskAI,
}) => {
    return (
        <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={onPlayPause}>
                <Ionicons
                    name={isPlaying ? "pause-circle" : "play-circle"}
                    size={24}
                    color={COLORS.primary}
                />
                <Text style={styles.actionButtonText}>
                    {isPlaying ? "Pause" : "Read Aloud"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.actionButton}
                onPress={onToggleTextFormat}
            >
                <Ionicons
                    name={showPlainText ? "document" : "document-text"}
                    size={24}
                    color={COLORS.primary}
                />
                <Text style={styles.actionButtonText}>
                    {showPlainText ? "Show Markdown" : "Show Text"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onShare}>
                <Ionicons
                    name="share-social-outline"
                    size={24}
                    color={COLORS.primary}
                />
                <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onCopy}>
                <Ionicons
                    name="copy-outline"
                    size={24}
                    color={COLORS.primary}
                />
                <Text style={styles.actionButtonText}>Copy</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.actionButton}
                onPress={onToggleStar}
            >
                <Ionicons
                    name={isStarred ? "star" : "star-outline"}
                    size={24}
                    color={isStarred ? COLORS.warning : COLORS.primary}
                />
                <Text style={styles.actionButtonText}>
                    {isStarred ? "Starred" : "Star"}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.actionButton}
                onPress={onRegenerate}
                disabled={isLoading}
            >
                <Ionicons
                    name="refresh-outline"
                    size={24}
                    color={isLoading ? COLORS.disabled : COLORS.primary}
                />
                <Text
                    style={[
                        styles.actionButtonText,
                        isLoading && { color: COLORS.disabled },
                    ]}
                >
                    Regenerate
                </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onNewType}>
                <Ionicons
                    name="add-circle-outline"
                    size={24}
                    color={COLORS.primary}
                />
                <Text style={styles.actionButtonText}>New Type</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onAskAI}>
                <Ionicons
                    name="chatbubble-outline"
                    size={24}
                    color={COLORS.primary}
                />
                <Text style={styles.actionButtonText}>Ask AI</Text>
            </TouchableOpacity>
        </View>
    );
};

ActionButtons.propTypes = {
    isPlaying: PropTypes.bool.isRequired,
    showPlainText: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    isStarred: PropTypes.bool.isRequired,
    onPlayPause: PropTypes.func.isRequired,
    onToggleTextFormat: PropTypes.func.isRequired,
    onShare: PropTypes.func.isRequired,
    onCopy: PropTypes.func.isRequired,
    onToggleStar: PropTypes.func.isRequired,
    onRegenerate: PropTypes.func.isRequired,
    onNewType: PropTypes.func.isRequired,
    onAskAI: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
    actionButtonsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-around",
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.background,
    },
    actionButton: {
        alignItems: "center",
        justifyContent: "center",
        padding: SPACING.sm,
        minWidth: 70,
        marginHorizontal: 2,
        marginVertical: 4,
    },
    actionButtonText: {
        fontSize: FONT_SIZES.xs,
        color: COLORS.text,
        marginTop: 4,
    },
});

export default ActionButtons;
