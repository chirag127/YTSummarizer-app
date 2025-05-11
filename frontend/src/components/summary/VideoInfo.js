import React from "react";
import { StyleSheet, View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";

import { COLORS, SPACING, FONT_SIZES } from "../../constants";

/**
 * VideoInfo component displays the video thumbnail, title, and a link to the original video
 * 
 * @param {Object} props
 * @param {string} props.videoTitle - The title of the video
 * @param {string} props.videoThumbnailUrl - The URL of the video thumbnail
 * @param {string} props.videoUrl - The URL of the original video
 * @param {Function} props.onOpenVideo - Function to handle opening the original video
 */
const VideoInfo = ({ videoTitle, videoThumbnailUrl, videoUrl, onOpenVideo }) => {
  return (
    <View style={styles.videoInfoContainer}>
      <Image
        source={{
          uri: videoThumbnailUrl || "https://via.placeholder.com/480x360?text=No+Thumbnail",
        }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <Text style={styles.videoTitle}>{videoTitle}</Text>
      <TouchableOpacity
        style={styles.videoLinkButton}
        onPress={onOpenVideo}
      >
        <Ionicons
          name="logo-youtube"
          size={16}
          color={COLORS.error}
        />
        <Text style={styles.videoLinkText}>
          Watch Original Video
        </Text>
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

const styles = StyleSheet.create({
  videoInfoContainer: {
    backgroundColor: COLORS.surface,
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
    color: COLORS.text,
    padding: SPACING.md,
  },
  videoLinkButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  videoLinkText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
});

export default VideoInfo;
