import React from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";

import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * VideoInfo component displays the video thumbnail, title, and a link to the original video
 *
 * @param {Object} props
 * @param {string} props.videoTitle - The title of the video
 * @param {string} props.videoThumbnailUrl - The URL of the video thumbnail
 * @param {string} props.videoUrl - The URL of the original video
 * @param {Function} props.onOpenVideo - Function to handle opening the original video
 */
const VideoInfo = ({
    videoTitle,
    videoThumbnailUrl,
    videoUrl,
    onOpenVideo,
}) => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        videoInfoContainer: {
            backgroundColor: colors.surface,
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: SPACING.md,
        },
        thumbnail: {
            width: "100%",
            height: 200,
        },
        videoTitle: {
            fontSize: FONT_SIZES.lg,
            fontWeight: "bold",
            color: colors.text,
            padding: SPACING.md,
        },
        videoLinkButton: {
            flexDirection: "row",
            alignItems: "center",
            padding: SPACING.md,
            borderTopWidth: 1,
            borderTopColor: colors.border,
        },
        videoLinkText: {
            fontSize: FONT_SIZES.md,
            color: colors.primary,
            marginLeft: SPACING.sm,
        },
    }));

    return (
        <View style={styles.videoInfoContainer}>
            <Image
                source={{
                    uri:
                        videoThumbnailUrl ||
                        "https://via.placeholder.com/480x360?text=No+Thumbnail",
                }}
                style={styles.thumbnail}
                resizeMode="cover"
            />
            <Text style={styles.videoTitle}>{videoTitle}</Text>
            <TouchableOpacity
                style={styles.videoLinkButton}
                onPress={onOpenVideo}
            >
                <Ionicons name="logo-youtube" size={16} color={colors.error} />
                <Text style={styles.videoLinkText}>Watch Original Video</Text>
            </TouchableOpacity>
        </View>
    );
};

VideoInfo.propTypes = {
    videoTitle: PropTypes.string.isRequired,
    videoThumbnailUrl: PropTypes.string,
    videoUrl: PropTypes.string.isRequired,
    onOpenVideo: PropTypes.func.isRequired,
};

export default VideoInfo;
