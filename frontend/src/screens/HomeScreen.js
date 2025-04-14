import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import components, services, and utilities
import { validateYouTubeUrl, generateSummary } from '../services/api';
import { isValidYouTubeUrl } from '../utils';
import { COLORS, SPACING, FONT_SIZES, SUMMARY_TYPES, SUMMARY_LENGTHS, SCREENS } from '../constants';

// Constants
const LAST_SETTINGS_KEY = 'last_summary_settings';

const HomeScreen = ({ navigation }) => {
  // State
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [summaryType, setSummaryType] = useState(SUMMARY_TYPES[0].id);
  const [summaryLength, setSummaryLength] = useState(SUMMARY_LENGTHS[1].id);

  // Load last used settings
  useEffect(() => {
    const loadLastSettings = async () => {
      try {
        const settingsString = await AsyncStorage.getItem(LAST_SETTINGS_KEY);
        if (settingsString) {
          const settings = JSON.parse(settingsString);
          setSummaryType(settings.type || SUMMARY_TYPES[0].id);
          setSummaryLength(settings.length || SUMMARY_LENGTHS[1].id);
        }
      } catch (error) {
        console.error('Error loading last settings:', error);
      }
    };

    loadLastSettings();
  }, []);

  // Save settings when changed
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem(
          LAST_SETTINGS_KEY,
          JSON.stringify({ type: summaryType, length: summaryLength })
        );
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };

    saveSettings();
  }, [summaryType, summaryLength]);

  // Handle URL input change
  const handleUrlChange = (text) => {
    setUrl(text);
    setIsValidUrl(true); // Reset validation on change
  };

  // Handle URL submission
  const handleSubmit = async () => {
    // Client-side validation
    if (!url.trim() || !isValidYouTubeUrl(url)) {
      setIsValidUrl(false);
      return;
    }

    setIsLoading(true);

    try {
      // Validate URL with backend
      const validationResult = await validateYouTubeUrl(url);

      if (!validationResult.valid) {
        Alert.alert('Invalid URL', 'Please enter a valid YouTube URL.');
        setIsValidUrl(false);
        return;
      }

      if (!validationResult.has_transcript) {
        Alert.alert(
          'No Transcript Available',
          'This video does not have captions or transcripts available for summarization.'
        );
        return;
      }

      // Generate summary
      const summary = await generateSummary(url, summaryType, summaryLength);

      // Navigate to summary screen
      navigation.navigate(SCREENS.SUMMARY, { summary });
    } catch (error) {
      console.error('Error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'An error occurred while processing your request.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Render summary type options
  const renderSummaryTypeOptions = () => {
    return (
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>Summary Type:</Text>
        <View style={styles.optionsButtonGroup}>
          {SUMMARY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.optionButton,
                summaryType === type.id && styles.optionButtonSelected,
              ]}
              onPress={() => setSummaryType(type.id)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  summaryType === type.id && styles.optionButtonTextSelected,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Render summary length options
  const renderSummaryLengthOptions = () => {
    return (
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsLabel}>Summary Length:</Text>
        <View style={styles.optionsButtonGroup}>
          {SUMMARY_LENGTHS.map((length) => (
            <TouchableOpacity
              key={length.id}
              style={[
                styles.optionButton,
                summaryLength === length.id && styles.optionButtonSelected,
              ]}
              onPress={() => setSummaryLength(length.id)}
            >
              <Text
                style={[
                  styles.optionButtonText,
                  summaryLength === length.id && styles.optionButtonTextSelected,
                ]}
              >
                {length.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar style="auto" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>YouTube Summarizer</Text>
          <Text style={styles.subtitle}>
            Get AI-powered summaries of YouTube videos
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, !isValidUrl && styles.inputError]}
            placeholder="Paste YouTube URL here"
            value={url}
            onChangeText={handleUrlChange}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          {!isValidUrl && (
            <Text style={styles.errorText}>
              Please enter a valid YouTube URL
            </Text>
          )}
        </View>

        {renderSummaryTypeOptions()}
        {renderSummaryLengthOptions()}

        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.background} />
          ) : (
            <>
              <Ionicons name="document-text" size={20} color={COLORS.background} />
              <Text style={styles.buttonText}>Generate Summary</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: SPACING.lg,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.md,
    backgroundColor: COLORS.surface,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
  },
  optionsContainer: {
    marginBottom: SPACING.lg,
  },
  optionsLabel: {
    fontSize: FONT_SIZES.md,
    fontWeight: '500',
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
  optionsButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    marginLeft: SPACING.sm,
  },
});

export default HomeScreen;
