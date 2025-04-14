import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';

// Import components, services, and utilities
import { updateSummary } from '../services/api';
import { speakText, stopSpeaking, isSpeaking } from '../services/tts';
import { 
  formatDate, 
  truncateText, 
  copyToClipboard, 
  openUrl,
  formatSummaryType,
  formatSummaryLength,
} from '../utils';
import { 
  COLORS, 
  SPACING, 
  FONT_SIZES, 
  SUMMARY_TYPES, 
  SUMMARY_LENGTHS,
} from '../constants';

const SummaryScreen = ({ route, navigation }) => {
  // Get summary from route params
  const { summary } = route.params || {};

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState(summary?.summary_type || SUMMARY_TYPES[0].id);
  const [selectedLength, setSelectedLength] = useState(summary?.summary_length || SUMMARY_LENGTHS[1].id);

  // Set navigation title
  useEffect(() => {
    navigation.setOptions({
      title: truncateText(summary?.video_title || 'Summary', 30),
    });
  }, [navigation, summary]);

  // Check if TTS is playing
  useEffect(() => {
    const checkSpeakingStatus = async () => {
      const speaking = await isSpeaking();
      setIsPlaying(speaking);
    };

    const interval = setInterval(checkSpeakingStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Handle play/pause
  const handlePlayPause = async () => {
    if (isPlaying) {
      await stopSpeaking();
      setIsPlaying(false);
    } else {
      const success = await speakText(summary.summary_text);
      setIsPlaying(success);
    }
  };

  // Handle share
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Summary for "${summary.video_title}":\n\n${summary.summary_text}\n\nOriginal Video: ${summary.video_url}`,
      });
    } catch (error) {
      console.error('Error sharing summary:', error);
      Alert.alert('Error', 'Failed to share summary.');
    }
  };

  // Handle copy
  const handleCopy = async () => {
    const success = await copyToClipboard(summary.summary_text);
    if (success) {
      Alert.alert('Success', 'Summary copied to clipboard.');
    } else {
      Alert.alert('Error', 'Failed to copy summary to clipboard.');
    }
  };

  // Handle open original video
  const handleOpenVideo = async () => {
    await openUrl(summary.video_url);
  };

  // Handle edit
  const handleEdit = () => {
    setSelectedType(summary.summary_type);
    setSelectedLength(summary.summary_length);
    setEditModalVisible(true);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (selectedType === summary.summary_type && selectedLength === summary.summary_length) {
      setEditModalVisible(false);
      return;
    }

    setIsLoading(true);

    try {
      const updatedSummary = await updateSummary(
        summary.id,
        selectedType,
        selectedLength
      );

      // Close modal and update route params
      setEditModalVisible(false);
      navigation.setParams({ summary: updatedSummary });
    } catch (error) {
      console.error('Error updating summary:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to update summary.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Render edit modal
  const renderEditModal = () => {
    return (
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Summary</Text>

            <Text style={styles.modalLabel}>Summary Type:</Text>
            <View style={styles.optionsButtonGroup}>
              {SUMMARY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.optionButton,
                    selectedType === type.id && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      selectedType === type.id && styles.optionButtonTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Summary Length:</Text>
            <View style={styles.optionsButtonGroup}>
              {SUMMARY_LENGTHS.map((length) => (
                <TouchableOpacity
                  key={length.id}
                  style={[
                    styles.optionButton,
                    selectedLength === length.id && styles.optionButtonSelected,
                  ]}
                  onPress={() => setSelectedLength(length.id)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      selectedLength === length.id && styles.optionButtonTextSelected,
                    ]}
                  >
                    {length.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleSaveEdit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={COLORS.background} size="small" />
                ) : (
                  <Text style={styles.modalButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // If no summary, show error
  if (!summary) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Summary not found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderEditModal()}
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Video Info */}
        <View style={styles.videoInfoContainer}>
          <Image
            source={{ uri: summary.video_thumbnail_url || 'https://via.placeholder.com/480x360?text=No+Thumbnail' }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          <Text style={styles.videoTitle}>{summary.video_title}</Text>
          <TouchableOpacity
            style={styles.videoLinkButton}
            onPress={handleOpenVideo}
          >
            <Ionicons name="logo-youtube" size={16} color={COLORS.error} />
            <Text style={styles.videoLinkText}>Watch Original Video</Text>
          </TouchableOpacity>
        </View>

        {/* Summary Info */}
        <View style={styles.summaryInfoContainer}>
          <View style={styles.summaryTypeContainer}>
            <View style={styles.summaryTypeItem}>
              <Text style={styles.summaryTypeLabel}>Type:</Text>
              <Text style={styles.summaryTypeValue}>
                {formatSummaryType(summary.summary_type)}
              </Text>
            </View>
            <View style={styles.summaryTypeItem}>
              <Text style={styles.summaryTypeLabel}>Length:</Text>
              <Text style={styles.summaryTypeValue}>
                {formatSummaryLength(summary.summary_length)}
              </Text>
            </View>
            <View style={styles.summaryTypeItem}>
              <Text style={styles.summaryTypeLabel}>Created:</Text>
              <Text style={styles.summaryTypeValue}>
                {formatDate(summary.created_at)}
              </Text>
            </View>
          </View>
        </View>

        {/* Summary Content */}
        <View style={styles.summaryContentContainer}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <Markdown style={markdownStyles}>{summary.summary_text}</Markdown>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handlePlayPause}
        >
          <Ionicons
            name={isPlaying ? 'pause-circle' : 'play-circle'}
            size={24}
            color={COLORS.primary}
          />
          <Text style={styles.actionButtonText}>
            {isPlaying ? 'Pause' : 'Read Aloud'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShare}
        >
          <Ionicons name="share-social" size={24} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCopy}
        >
          <Ionicons name="copy" size={24} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Copy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleEdit}
        >
          <Ionicons name="create" size={24} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.error,
    textAlign: 'center',
  },
  videoInfoContainer: {
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  videoTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  videoLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  videoLinkText: {
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    fontSize: FONT_SIZES.sm,
  },
  summaryInfoContainer: {
    marginBottom: SPACING.lg,
  },
  summaryTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
  },
  summaryTypeItem: {
    marginBottom: SPACING.sm,
    minWidth: '30%',
  },
  summaryTypeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  summaryTypeValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontWeight: '500',
  },
  summaryContentContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
  },
  actionButtonText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.lg,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  optionsButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
  },
  optionButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionButtonText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
  },
  optionButtonTextSelected: {
    color: COLORS.background,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: COLORS.surface,
    marginRight: SPACING.sm,
  },
  modalSaveButton: {
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  modalButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.background,
  },
});

const markdownStyles = {
  body: {
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
  },
  heading1: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heading2: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  heading3: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  paragraph: {
    marginBottom: SPACING.md,
    lineHeight: 22,
  },
  list_item: {
    marginBottom: SPACING.sm,
  },
  bullet_list: {
    marginBottom: SPACING.md,
  },
  ordered_list: {
    marginBottom: SPACING.md,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    paddingLeft: SPACING.md,
    marginLeft: SPACING.sm,
    marginBottom: SPACING.md,
    opacity: 0.8,
  },
  code_block: {
    backgroundColor: '#f5f5f5',
    padding: SPACING.md,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: SPACING.md,
  },
  code_inline: {
    backgroundColor: '#f5f5f5',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    padding: 4,
    borderRadius: 2,
  },
  link: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
};

export default SummaryScreen;
