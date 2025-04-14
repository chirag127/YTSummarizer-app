import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants for TTS settings
const TTS_SETTINGS_KEY = 'tts_settings';
const DEFAULT_SETTINGS = {
  rate: 1.0,  // Normal speed
  pitch: 1.0, // Normal pitch
  voice: null // Default voice
};

// Get stored TTS settings
export const getTTSSettings = async () => {
  try {
    const settingsString = await AsyncStorage.getItem(TTS_SETTINGS_KEY);
    if (settingsString) {
      return JSON.parse(settingsString);
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error retrieving TTS settings:', error);
    return DEFAULT_SETTINGS;
  }
};

// Save TTS settings
export const saveTTSSettings = async (settings) => {
  try {
    const settingsToSave = { ...DEFAULT_SETTINGS, ...settings };
    await AsyncStorage.setItem(TTS_SETTINGS_KEY, JSON.stringify(settingsToSave));
    return true;
  } catch (error) {
    console.error('Error saving TTS settings:', error);
    return false;
  }
};

// Get available voices
export const getAvailableVoices = async () => {
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    return voices;
  } catch (error) {
    console.error('Error getting available voices:', error);
    return [];
  }
};

// Speak text with current settings
export const speakText = async (text) => {
  try {
    // Get current settings
    const settings = await getTTSSettings();
    
    // Stop any ongoing speech
    await Speech.stop();
    
    // Speak with settings
    await Speech.speak(text, {
      rate: settings.rate,
      pitch: settings.pitch,
      voice: settings.voice,
      onStart: () => console.log('Started speaking'),
      onDone: () => console.log('Done speaking'),
      onStopped: () => console.log('Stopped speaking'),
      onError: (error) => console.error('Error speaking:', error),
    });
    
    return true;
  } catch (error) {
    console.error('Error speaking text:', error);
    return false;
  }
};

// Stop speaking
export const stopSpeaking = async () => {
  try {
    await Speech.stop();
    return true;
  } catch (error) {
    console.error('Error stopping speech:', error);
    return false;
  }
};

// Check if speaking
export const isSpeaking = async () => {
  try {
    return await Speech.isSpeakingAsync();
  } catch (error) {
    console.error('Error checking if speaking:', error);
    return false;
  }
};

export default {
  getTTSSettings,
  saveTTSSettings,
  getAvailableVoices,
  speakText,
  stopSpeaking,
  isSpeaking,
};
