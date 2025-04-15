import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Constants for TTS settings
const TTS_SETTINGS_KEY = "tts_settings";
const DEFAULT_SETTINGS = {
    rate: 1.0, // Normal speed
    pitch: 1.0, // Normal pitch
    voice: null, // Default voice
};

// Global callback handlers
let onBoundaryCallback = null;
let onDoneCallback = null;
let onStartCallback = null;
let onStoppedCallback = null;

// Get stored TTS settings
export const getTTSSettings = async () => {
    try {
        const settingsString = await AsyncStorage.getItem(TTS_SETTINGS_KEY);
        if (settingsString) {
            return JSON.parse(settingsString);
        }
        return DEFAULT_SETTINGS;
    } catch (error) {
        console.error("Error retrieving TTS settings:", error);
        return DEFAULT_SETTINGS;
    }
};

// Save TTS settings
export const saveTTSSettings = async (settings) => {
    try {
        const settingsToSave = { ...DEFAULT_SETTINGS, ...settings };
        await AsyncStorage.setItem(
            TTS_SETTINGS_KEY,
            JSON.stringify(settingsToSave)
        );
        return true;
    } catch (error) {
        console.error("Error saving TTS settings:", error);
        return false;
    }
};

// Get available voices
export const getAvailableVoices = async () => {
    try {
        const voices = await Speech.getAvailableVoicesAsync();
        return voices;
    } catch (error) {
        console.error("Error getting available voices:", error);
        return [];
    }
};

// Set callbacks for speech events
export const setSpeechCallbacks = (callbacks = {}) => {
    onBoundaryCallback = callbacks.onBoundary || null;
    onDoneCallback = callbacks.onDone || null;
    onStartCallback = callbacks.onStart || null;
    onStoppedCallback = callbacks.onStopped || null;
};

// Clear all callbacks
export const clearSpeechCallbacks = () => {
    onBoundaryCallback = null;
    onDoneCallback = null;
    onStartCallback = null;
    onStoppedCallback = null;
};

// Process text to split into sentences and words for highlighting
export const processTextForSpeech = (text) => {
    // Split text into sentences
    const sentences = text.split(/(?<=[.!?])\s+/);

    // Create a map of word positions
    let wordMap = [];
    let charIndex = 0;

    sentences.forEach((sentence, sentenceIndex) => {
        // Split sentence into words
        const words = sentence.split(/\s+/);

        words.forEach((word, wordIndex) => {
            wordMap.push({
                word,
                sentenceIndex,
                wordIndex,
                startChar: charIndex,
                endChar: charIndex + word.length,
            });

            // Update character index (add word length + 1 for space)
            charIndex += word.length + 1;
        });
    });

    return {
        sentences,
        wordMap,
        fullText: text,
    };
};

// Speak text with current settings
export const speakText = async (text, startSentenceIndex = 0) => {
    try {
        // Get current settings
        const settings = await getTTSSettings();

        // Stop any ongoing speech
        await Speech.stop();

        // Process text for speech
        const processedText = processTextForSpeech(text);

        // If starting from a specific sentence, adjust the text
        let speakingText = text;
        let startCharIndex = 0;

        if (
            startSentenceIndex > 0 &&
            startSentenceIndex < processedText.sentences.length
        ) {
            // Find the starting character index for the sentence
            const sentenceWords = processedText.wordMap.filter(
                (w) => w.sentenceIndex === startSentenceIndex
            );
            if (sentenceWords.length > 0) {
                startCharIndex = sentenceWords[0].startChar;
                speakingText = text.substring(startCharIndex);
            }
        }

        // Speak with settings
        await Speech.speak(speakingText, {
            rate: settings.rate,
            pitch: settings.pitch,
            voice: settings.voice,
            onStart: () => {
                console.log("Started speaking");
                if (onStartCallback) onStartCallback(startSentenceIndex);
            },
            onDone: () => {
                console.log("Done speaking");
                if (onDoneCallback) onDoneCallback();
            },
            onStopped: () => {
                console.log("Stopped speaking");
                if (onStoppedCallback) onStoppedCallback();
            },
            onError: (error) => console.error("Error speaking:", error),
            onBoundary: (event) => {
                if (onBoundaryCallback) {
                    // Adjust the character index if we're starting from a specific sentence
                    const adjustedCharIndex = event.charIndex + startCharIndex;

                    // Find the word at this character index
                    const currentWord = processedText.wordMap.find(
                        (w) =>
                            adjustedCharIndex >= w.startChar &&
                            adjustedCharIndex <= w.endChar
                    );

                    if (currentWord) {
                        onBoundaryCallback({
                            ...event,
                            charIndex: adjustedCharIndex,
                            word: currentWord.word,
                            sentenceIndex: currentWord.sentenceIndex,
                            wordIndex: currentWord.wordIndex,
                        });
                    }
                }
            },
        });

        return true;
    } catch (error) {
        console.error("Error speaking text:", error);
        return false;
    }
};

// Stop speaking
export const stopSpeaking = async () => {
    try {
        await Speech.stop();
        return true;
    } catch (error) {
        console.error("Error stopping speech:", error);
        return false;
    }
};

// Check if speaking
export const isSpeaking = async () => {
    try {
        return await Speech.isSpeakingAsync();
    } catch (error) {
        console.error("Error checking if speaking:", error);
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
    setSpeechCallbacks,
    clearSpeechCallbacks,
    processTextForSpeech,
};
