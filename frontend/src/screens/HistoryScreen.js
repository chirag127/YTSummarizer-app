import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// Import components, services, and utilities
import { getAllSummaries, deleteSummary } from '../services/api';
import { formatDate, truncateText } from '../utils';
import { COLORS, SPACING, FONT_SIZES, SCREENS } from '../constants';

const HistoryScreen = ({ navigation }) => {
  // State
  const [summaries, setSummaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch summaries
  const fetchSummaries = async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);
    
    try {
      const data = await getAllSummaries();
      setSummaries(data);
    } catch (error) {
      console.error('Error fetching summaries:', error);
      setError('Failed to load summaries. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSummaries();
  }, []);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchSummaries();
    }, [])
  );

  // Handle refresh
  const handleRefresh = () => {
    fetchSummaries(true);
  };

  // Handle delete
  const handleDelete = (id) => {
    Alert.alert(
      'Delete Summary',
      'Are you sure you want to delete this summary?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSummary(id);
              // Remove from state
              setSummaries((prevSummaries) =>
                prevSummaries.filter((summary) => summary.id !== id)
              );
            } catch (error) {
              console.error('Error deleting summary:', error);
              Alert.alert('Error', 'Failed to delete summary.');
            }
          },
        },
      ]
    );
  };

  // Render summary item
  const renderSummaryItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.summaryItem}
        onPress={() => navigation.navigate(SCREENS.SUMMARY, { summary: item })}
      >
        <Image
          source={{ uri: item.video_thumbnail_url || 'https://via.placeholder.com/480x360?text=No+Thumbnail' }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryTitle} numberOfLines={2}>
            {item.video_title || 'Untitled Video'}
          </Text>
          <Text style={styles.summaryDate}>
            {formatDate(item.created_at)}
          </Text>
          <View style={styles.summaryTypeContainer}>
            <Text style={styles.summaryType}>
              {item.summary_type} • {item.summary_length}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.emptyText}>Loading summaries...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchSummaries()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="document-text-outline" size={48} color={COLORS.textSecondary} />
        <Text style={styles.emptyText}>No summaries yet</Text>
        <Text style={styles.emptySubtext}>
          Summaries you generate will appear here
        </Text>
        <TouchableOpacity
          style={styles.newSummaryButton}
          onPress={() => navigation.navigate('HomeTab')}
        >
          <Text style={styles.newSummaryButtonText}>Create New Summary</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={summaries}
        renderItem={renderSummaryItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.md,
    flexGrow: 1,
  },
  summaryItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  thumbnail: {
    width: 100,
    height: 80,
  },
  summaryInfo: {
    flex: 1,
    padding: SPACING.sm,
    justifyContent: 'space-between',
  },
  summaryTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 4,
  },
  summaryDate: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryType: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.primary,
    fontWeight: '500',
  },
  deleteButton: {
    padding: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    minHeight: 300,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  newSummaryButton: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
  },
  newSummaryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
});

export default HistoryScreen;
