import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import { COLORS, SPACING, FONT_SIZES } from "../../constants";

/**
 * OfflineDataSection component displays cache information and provides actions to clear various caches
 */
const OfflineDataSection = ({
  cacheInfo,
  queueCount,
  syncLogCount,
  isLoading,
  onClearSummariesCache,
  onClearThumbnailsCache,
  onClearQueue,
  onClearSyncLog,
  onProcessQueue,
  isOnline,
  formatBytes,
}) => {
  return (
    <View style={styles.settingSection}>
      <Text style={styles.settingTitle}>Offline Data</Text>

      {isLoading ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : (
        <>
          <View style={styles.cacheInfoContainer}>
            <View style={styles.cacheInfoItem}>
              <Text style={styles.cacheInfoLabel}>
                Summaries Cache:
              </Text>
              <Text style={styles.cacheInfoValue}>
                {formatBytes(cacheInfo.summariesSize)}
              </Text>
            </View>
            <View style={styles.cacheInfoItem}>
              <Text style={styles.cacheInfoLabel}>
                Thumbnails Cache:
              </Text>
              <Text style={styles.cacheInfoValue}>
                {formatBytes(cacheInfo.thumbnailsSize)}
              </Text>
            </View>
            <View style={styles.cacheInfoItem}>
              <Text style={styles.cacheInfoLabel}>
                Queue Items:
              </Text>
              <Text style={styles.cacheInfoValue}>
                {queueCount}
              </Text>
            </View>
            <View style={styles.cacheInfoItem}>
              <Text style={styles.cacheInfoLabel}>
                Pending Sync Actions:
              </Text>
              <Text style={styles.cacheInfoValue}>
                {syncLogCount}
              </Text>
            </View>
            <View style={styles.cacheInfoItem}>
              <Text style={styles.cacheInfoLabel}>
                Last Updated:
              </Text>
              <Text style={styles.cacheInfoValue}>
                {new Date(
                  cacheInfo.lastUpdated
                ).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.cacheActionsContainer}>
            <TouchableOpacity
              style={styles.cacheActionButton}
              onPress={onClearSummariesCache}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={COLORS.error}
              />
              <Text style={styles.cacheActionButtonText}>
                Clear Summaries
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cacheActionButton}
              onPress={onClearThumbnailsCache}
            >
              <Ionicons
                name="image-outline"
                size={18}
                color={COLORS.error}
              />
              <Text style={styles.cacheActionButtonText}>
                Clear Thumbnails
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cacheActionButton}
              onPress={onClearQueue}
              disabled={queueCount === 0}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={
                  queueCount === 0
                    ? COLORS.disabled
                    : COLORS.error
                }
              />
              <Text
                style={[
                  styles.cacheActionButtonText,
                  queueCount === 0 && {
                    color: COLORS.disabled,
                  },
                ]}
              >
                Clear Queue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cacheActionButton}
              onPress={onClearSyncLog}
              disabled={syncLogCount === 0}
            >
              <Ionicons
                name="sync-outline"
                size={18}
                color={
                  syncLogCount === 0
                    ? COLORS.disabled
                    : COLORS.error
                }
              />
              <Text
                style={[
                  styles.cacheActionButtonText,
                  syncLogCount === 0 && {
                    color: COLORS.disabled,
                  },
                ]}
              >
                Clear Sync Log
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.cacheActionButton,
                styles.processQueueButton,
              ]}
              onPress={onProcessQueue}
              disabled={!isOnline || syncLogCount === 0}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={18}
                color={
                  !isOnline || syncLogCount === 0
                    ? COLORS.disabled
                    : COLORS.primary
                }
              />
              <Text
                style={[
                  styles.cacheActionButtonText,
                  styles.processQueueButtonText,
                  (!isOnline || syncLogCount === 0) && {
                    color: COLORS.disabled,
                  },
                ]}
              >
                Process Queue
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

OfflineDataSection.propTypes = {
  cacheInfo: PropTypes.shape({
    summariesSize: PropTypes.number.isRequired,
    thumbnailsSize: PropTypes.number.isRequired,
    lastUpdated: PropTypes.number.isRequired,
  }).isRequired,
  queueCount: PropTypes.number.isRequired,
  syncLogCount: PropTypes.number.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onClearSummariesCache: PropTypes.func.isRequired,
  onClearThumbnailsCache: PropTypes.func.isRequired,
  onClearQueue: PropTypes.func.isRequired,
  onClearSyncLog: PropTypes.func.isRequired,
  onProcessQueue: PropTypes.func.isRequired,
  isOnline: PropTypes.bool.isRequired,
  formatBytes: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  settingSection: {
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
  },
  settingTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  cacheInfoContainer: {
    marginBottom: SPACING.md,
  },
  cacheInfoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  cacheInfoLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  cacheInfoValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: "500",
  },
  cacheActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cacheActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    minWidth: "48%",
  },
  cacheActionButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    marginLeft: SPACING.xs,
  },
  processQueueButton: {
    borderColor: COLORS.primary,
  },
  processQueueButtonText: {
    color: COLORS.primary,
  },
});

export default OfflineDataSection;
