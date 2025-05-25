import React from "react";
import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * Header component for the QA screen displaying video information and token counts
 *
 * @param {Object} props - Component props
 * @param {string} props.videoTitle - Title of the video
 * @param {string} props.videoThumbnail - URL of the video thumbnail
 * @param {number} props.transcriptTokenCount - Number of tokens in the transcript
 * @param {number} props.tokenCount - Total token count for the conversation
 * @returns {React.ReactElement} Header component
 */
const Header = ({
    videoTitle,
    videoThumbnail,
    transcriptTokenCount,
    tokenCount,
}) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        videoInfoContainer: {
            padding: SPACING.md,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
        },
        headerRow: {
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: SPACING.sm,
        },
        thumbnail: {
            width: "70%",
            height: 100,
            borderRadius: 8,
        },
        headerButtons: {
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            width: "30%",
        },
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
        videoTitle: {
            fontSize: FONT_SIZES.md,
            fontWeight: "500",
            color: colors.text,
            textAlign: "center",
        },
    }));

    return (
        <View style={styles.videoInfoContainer}>
            <View style={styles.headerRow}>
                <Image
                    source={{
                        uri:
                            videoThumbnail ||
                            "https://via.placeholder.com/480x360?text=No+Thumbnail",
                    }}
                    style={styles.thumbnail}
                />
                <View style={styles.headerButtons}>
                    <View style={styles.tokenCountsContainer}>
                        <View style={styles.tokenCountContainer}>
                            <Ionicons
                                name="document-text-outline"
                                size={14}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.tokenCountText}>
                                Transcript:{" "}
                                {transcriptTokenCount.toLocaleString()}
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
                </View>
            </View>
            <Text style={styles.videoTitle} numberOfLines={2}>
                {videoTitle}
            </Text>
        </View>
    );
};

Header.propTypes = {
    videoTitle: PropTypes.string.isRequired,
    videoThumbnail: PropTypes.string,
    transcriptTokenCount: PropTypes.number.isRequired,
    tokenCount: PropTypes.number.isRequired,
};

Header.defaultProps = {
    videoThumbnail: null,
};

export default Header;
