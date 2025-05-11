import React, { useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";

import { COLORS, SPACING, FONT_SIZES } from "../../constants";

/**
 * OtherSummaries component displays a list of other summaries for the same video
 * 
 * @param {Object} props
 * @param {Array} props.summaries - Array of other summaries
 * @param {boolean} props.isLoading - Whether summaries are being loaded
 * @param {Function} props.onNavigateToSummary - Function to handle navigating to another summary
 * @param {Function} props.formatDateWithTimeZone - Function to format the date with timezone
 * @param {boolean} props.initiallyExpanded - Whether the list is initially expanded
 */
const OtherSummaries = ({
  summaries,
  isLoading,
  onNavigateToSummary,
  formatDateWithTimeZone,
  initiallyExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  if (summaries.length === 0) return null;

  return (
    <View style={styles.otherSummariesContainer}>
      <View style={styles.otherSummariesHeader}>
        <Text style={styles.otherSummariesTitle}>
          Other Summaries for This Video
        </Text>
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading summaries...</Text>
        </View>
      )}

      {isExpanded && !isLoading && (
        <FlatList
          data={summaries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.otherSummaryItem}
              onPress={() => onNavigateToSummary(item)}
            >
              <View style={styles.otherSummaryInfo}>
                <View style={styles.otherSummaryBadges}>
                  <View style={[styles.badge, styles.typeBadge]}>
                    <Text style={styles.badgeText}>
                      {item.summary_type}
                    </Text>
                  </View>
                  <View style={[styles.badge, styles.lengthBadge]}>
                    <Text style={styles.badgeText}>
                      {item.summary_length}
                    </Text>
                  </View>
                </View>
                <Text style={styles.otherSummaryDate}>
                  {formatDateWithTimeZone(item.created_at)}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
          style={styles.otherSummariesList}
          scrollEnabled={false}
          nestedScrollEnabled={true}
        />
      )}
    </View>
  );
};

OtherSummaries.propTypes = {
  summaries: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onNavigateToSummary: PropTypes.func.isRequired,
  formatDateWithTimeZone: PropTypes.func.isRequired,
  initiallyExpanded: PropTypes.bool,
};

const styles = StyleSheet.create({
  otherSummariesContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: SPACING.lg,
    overflow: "hidden",
  },
  otherSummariesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  otherSummariesTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: "bold",
    color: COLORS.text,
  },
  loadingContainer: {
    padding: SPACING.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  otherSummariesList: {
    maxHeight: 300,
  },
  otherSummaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  otherSummaryInfo: {
    flex: 1,
  },
  otherSummaryBadges: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBadge: {
    backgroundColor: COLORS.primary,
  },
  lengthBadge: {
    backgroundColor: COLORS.secondary,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    color: "white",
    fontWeight: "500",
  },
  otherSummaryDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
});

export default OtherSummaries;
