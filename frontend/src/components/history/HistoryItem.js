import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { COLORS, SPACING, FONT_SIZES, SHADOWS } from '../../constants';

/**
 * HistoryItem component for rendering individual summary items
 * 
 * @param {Object} props - Component props
 * @param {Object} props.item - Summary item data
 * @param {Function} props.onPress - Function to handle pressing the item
 * @param {Function} props.onToggleStar - Function to handle toggling the star status
 * @param {Function} props.onDelete - Function to handle deleting the item
 * @param {Function} props.formatDate - Function to format the date
 * @returns {React.ReactElement} HistoryItem component
 */
const HistoryItem = ({ item, onPress, onToggleStar, onDelete, formatDate }) => {
  return (
    <TouchableOpacity
      style={styles.summaryItem}
      onPress={() => onPress(item)}
    >
      <Image
        source={{
          uri: item.video_thumbnail_url || "https://via.placeholder.com/480x360?text=No+Thumbnail",
        }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.summaryInfo}>
        <Text style={styles.summaryTitle} numberOfLines={2}>
          {item.video_title || "Untitled Video"}
        </Text>
        <Text style={styles.summaryDate}>
          {formatDate(item.created_at)}
        </Text>
        <View style={styles.summaryTypeContainer}>
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
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onToggleStar(item.id, item.is_starred)}
        >
          <Ionicons
            name={item.is_starred ? "star" : "star-outline"}
            size={20}
            color={
              item.is_starred
                ? COLORS.accent
                : COLORS.textSecondary
            }
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDelete(item.id)}
        >
          <Ionicons
            name="trash-outline"
            size={20}
            color={COLORS.error}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

HistoryItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    video_title: PropTypes.string,
    video_thumbnail_url: PropTypes.string,
    created_at: PropTypes.string.isRequired,
    summary_type: PropTypes.string.isRequired,
    summary_length: PropTypes.string.isRequired,
    is_starred: PropTypes.bool,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
  onToggleStar: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  formatDate: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  summaryItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: 4,
    marginRight: SPACING.md,
  },
  summaryInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  summaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  summaryDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  summaryTypeContainer: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: 4,
    marginRight: SPACING.xs,
  },
  typeBadge: {
    backgroundColor: COLORS.primary + '20', // 20% opacity
  },
  lengthBadge: {
    backgroundColor: COLORS.secondary + '20', // 20% opacity
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
  },
  actionsContainer: {
    justifyContent: 'space-between',
    paddingLeft: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.xs,
  },
});

export default React.memo(HistoryItem);
