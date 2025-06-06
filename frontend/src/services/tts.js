import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Constants for TTS settings
const TTS_SETTINGS_KEY = "tts_settings";
const DEFAULT_SETTINGS = {
    rate: 1.0, // Normal speed
    pitch: 1.0, // Normal pitch
    voice: null, // Default voice
};

// Maximum text length for TTS (characters)
// This is a conservative limit to avoid issues with different platforms
const MAX_TTS_CHUNK_LENGTH = 3000;

// Global state for chunked speech
let currentChunkIndex = 0;
let textChunks = [];
let isPlayingChunks = false;
let globalProcessedText = null; // Store the processed text for the entire content
let chunkOffsets = []; // Store the character offsets for each chunk
let sentenceIndicesMap = {}; // Map to track global sentence indices

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

        // Log the number of voices found for debugging
        console.log(`Found ${voices.length} TTS voices on device`);

        // If we have voices, return them
        if (voices && voices.length > 0) {
            return voices;
        }

        // If we're on web, try to use the browser's SpeechSynthesis API directly
        if (Platform.OS === "web" && window.speechSynthesis) {
            try {
                // Get voices from the browser's SpeechSynthesis API
                let webVoices = window.speechSynthesis.getVoices();

                // If no voices are returned immediately, wait for the voiceschanged event
                if (!webVoices || webVoices.length === 0) {
                    console.log(
                        "No voices available immediately, waiting for voiceschanged event"
                    );

                    // Wait for voices to be loaded (this happens asynchronously in some browsers)
                    await new Promise((resolve) => {
                        const voicesChangedHandler = () => {
                            window.speechSynthesis.removeEventListener(
                                "voiceschanged",
                                voicesChangedHandler
                            );
                            resolve();
                        };

                        window.speechSynthesis.addEventListener(
                            "voiceschanged",
                            voicesChangedHandler
                        );

                        // Set a timeout in case the event never fires
                        setTimeout(() => {
                            window.speechSynthesis.removeEventListener(
                                "voiceschanged",
                                voicesChangedHandler
                            );
                            resolve();
                        }, 1000);
                    });

                    // Try to get voices again after the event
                    webVoices = window.speechSynthesis.getVoices();
                }

                // Convert web voices to the format expected by the app
                if (webVoices && webVoices.length > 0) {
                    console.log(`Found ${webVoices.length} web voices`);

                    return webVoices.map((voice) => ({
                        identifier: voice.voiceURI,
                        name: voice.name,
                        quality: 300,
                        language: voice.lang,
                    }));
                }
            } catch (webError) {
                console.error("Error getting web voices:", webError);
            }
        }

        // Return empty array if no voices are found
        return [];
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

// Split text into manageable chunks for TTS
const splitTextIntoChunks = (text) => {
    if (!text) return [];

    // If text is shorter than the max length, return it as a single chunk
    if (text.length <= MAX_TTS_CHUNK_LENGTH) {
        return [text];
    }

    const chunks = [];
    let startIndex = 0;

    while (startIndex < text.length) {
        // Find a good breaking point (end of sentence) within the max length
        let endIndex = startIndex + MAX_TTS_CHUNK_LENGTH;

        // If we're not at the end of the text
        if (endIndex < text.length) {
            // Look for the last sentence break before the max length
            const lastSentenceBreak = text
                .substring(startIndex, endIndex)
                .lastIndexOf(". ");

            if (lastSentenceBreak !== -1) {
                // Found a sentence break, use it as the end point (add 2 to include the period and space)
                endIndex = startIndex + lastSentenceBreak + 2;
            } else {
                // No sentence break found, look for other punctuation or spaces
                const lastBreak = Math.max(
                    text.substring(startIndex, endIndex).lastIndexOf(". "),
                    text.substring(startIndex, endIndex).lastIndexOf("! "),
                    text.substring(startIndex, endIndex).lastIndexOf("? "),
                    text.substring(startIndex, endIndex).lastIndexOf("\n"),
                    text.substring(startIndex, endIndex).lastIndexOf(" ")
                );

                if (lastBreak !== -1) {
                    // Found a break point, use it
                    endIndex = startIndex + lastBreak + 1;
                }
                // If no break point is found, we'll use the max length
            }
        }

        // Add the chunk
        chunks.push(text.substring(startIndex, endIndex));

        // Move to the next chunk
        startIndex = endIndex;
    }

    return chunks;
};

// Process text to split into sentences and words for highlighting
export const processTextForSpeech = (text) => {
    // Split text into sentences
    const sentenceStrings = text.split(/(?<=[.!?])\s+/);

    // Create a map of word positions and structured sentences
    let wordMap = [];
    let sentences = [];
    let charIndex = 0;

    sentenceStrings.forEach((sentenceString, sentenceIndex) => {
        // Split sentence into words
        const wordStrings = sentenceString.split(/\s+/);
        const sentenceWords = [];

        wordStrings.forEach((word, wordIndex) => {
            // Skip empty words
            if (word.trim() === "") return;

            // Add to the word map
            wordMap.push({
                word,
                sentenceIndex,
                wordIndex,
                startChar: charIndex,
                endChar: charIndex + word.length,
            });

            // Add to the sentence words array
            sentenceWords.push(word);

            // Update character index (add word length + 1 for space)
            charIndex += word.length + 1;
        });

        // Add the structured sentence with its words
        sentences.push({
            text: sentenceString,
            words: sentenceWords,
        });
    });

    return {
        sentences,
        wordMap,
        fullText: text,
    };
};

// Speak a single chunk of text
const speakChunk = async (
    chunk,
    settings,
    startSentenceIndex = 0,
    isLastChunk = false,
    globalStartSentenceIndex = 0
) => {
    try {
        console.log(
            `speakChunk called with startSentenceIndex: ${startSentenceIndex}, globalStartSentenceIndex: ${globalStartSentenceIndex}`
        );

        // Process text for speech
        const processedText = processTextForSpeech(chunk);
        console.log(`Chunk has ${processedText.sentences.length} sentences`);

        // If starting from a specific sentence, adjust the text
        let speakingText = chunk;
        let startCharIndex = 0;

        if (
            startSentenceIndex >= 0 &&
            startSentenceIndex < processedText.sentences.length
        ) {
            console.log(
                `Starting from sentence ${startSentenceIndex} in this chunk`
            );

            // Find the starting character index for the sentence
            const sentenceWords = processedText.wordMap.filter(
                (w) => w.sentenceIndex === startSentenceIndex
            );

            console.log(
                `Found ${sentenceWords.length} words in sentence ${startSentenceIndex}`
            );

            if (sentenceWords.length > 0) {
                startCharIndex = sentenceWords[0].startChar;
                speakingText = chunk.substring(startCharIndex);
                console.log(
                    `Starting from character ${startCharIndex}, text: "${speakingText.substring(
                        0,
                        50
                    )}..."`
                );
            } else {
                console.warn(
                    `No words found for sentence ${startSentenceIndex}`
                );
            }
        } else if (startSentenceIndex >= processedText.sentences.length) {
            console.warn(
                `Invalid startSentenceIndex: ${startSentenceIndex}, max: ${
                    processedText.sentences.length - 1
                }. Using full chunk.`
            );
        }

        // Prepare speech options
        const speechOptions = {
            rate: settings.rate,
            pitch: settings.pitch,
            onStart: () => {
                console.log("Started speaking chunk");
                if (onStartCallback && currentChunkIndex === 0) {
                    onStartCallback(startSentenceIndex);
                }
            },
            onDone: () => {
                console.log("Done speaking chunk");

                // If this is the last chunk or chunking was stopped, call the done callback
                if (isLastChunk || !isPlayingChunks) {
                    if (onDoneCallback) onDoneCallback();
                } else {
                    // Move to the next chunk
                    currentChunkIndex++;
                    if (
                        currentChunkIndex < textChunks.length &&
                        isPlayingChunks
                    ) {
                        // Find the first sentence in the next chunk
                        let nextGlobalSentenceIndex = 0;

                        // Look through the sentence indices map to find the first sentence in the next chunk
                        Object.keys(sentenceIndicesMap).forEach(
                            (globalIndex) => {
                                const mapping = sentenceIndicesMap[globalIndex];
                                if (
                                    mapping.chunkIndex === currentChunkIndex &&
                                    (nextGlobalSentenceIndex === 0 ||
                                        parseInt(globalIndex) <
                                            nextGlobalSentenceIndex)
                                ) {
                                    nextGlobalSentenceIndex =
                                        parseInt(globalIndex);
                                }
                            }
                        );

                        // If we found a valid sentence index, use its local index
                        let nextLocalSentenceIndex = 0;
                        if (
                            nextGlobalSentenceIndex > 0 &&
                            sentenceIndicesMap[nextGlobalSentenceIndex]
                        ) {
                            nextLocalSentenceIndex =
                                sentenceIndicesMap[nextGlobalSentenceIndex]
                                    .localSentenceIndex;
                        }

                        speakChunk(
                            textChunks[currentChunkIndex],
                            settings,
                            nextLocalSentenceIndex,
                            currentChunkIndex === textChunks.length - 1,
                            nextGlobalSentenceIndex
                        );
                    }
                }
            },
            onStopped: () => {
                console.log("Stopped speaking chunk");
                if (onStoppedCallback) onStoppedCallback();
            },
            onError: (error) => console.error("Error speaking chunk:", error),
            onBoundary: (event) => {
                if (onBoundaryCallback && globalProcessedText) {
                    // Adjust the character index if we're starting from a specific sentence
                    const localAdjustedCharIndex =
                        event.charIndex + startCharIndex;

                    // Calculate the global character index by adding the chunk offset
                    const chunkOffset = chunkOffsets[currentChunkIndex] || 0;
                    const globalCharIndex =
                        chunkOffset + localAdjustedCharIndex;

                    // Find the word in the global word map
                    const lookAheadOffset = 2; // Look ahead by 2 characters to predict the next word

                    // First try to find the exact word in the global word map
                    let globalWord = globalProcessedText.wordMap.find(
                        (w) =>
                            globalCharIndex >= w.startChar &&
                            globalCharIndex <= w.endChar
                    );

                    // If not found, try with the look-ahead offset
                    if (!globalWord) {
                        globalWord = globalProcessedText.wordMap.find(
                            (w) =>
                                globalCharIndex + lookAheadOffset >=
                                    w.startChar &&
                                globalCharIndex + lookAheadOffset <= w.endChar
                        );
                    }

                    // If still not found, find the closest word
                    if (!globalWord) {
                        // Find the closest word by character index
                        const sortedWords = [
                            ...globalProcessedText.wordMap,
                        ].sort((a, b) => {
                            const distA = Math.min(
                                Math.abs(globalCharIndex - a.startChar),
                                Math.abs(globalCharIndex - a.endChar)
                            );
                            const distB = Math.min(
                                Math.abs(globalCharIndex - b.startChar),
                                Math.abs(globalCharIndex - b.endChar)
                            );
                            return distA - distB;
                        });

                        if (sortedWords.length > 0) {
                            globalWord = sortedWords[0];
                        }
                    }

                    if (globalWord) {
                        // Add a small delay to account for the boundary event timing
                        // This helps synchronize the highlighting with the actual speech
                        setTimeout(() => {
                            onBoundaryCallback({
                                ...event,
                                charIndex: globalCharIndex,
                                word: globalWord.word,
                                sentenceIndex: globalWord.sentenceIndex,
                                wordIndex: globalWord.wordIndex,
                            });
                        }, 0); // Minimal delay to put this at the end of the event queue
                    }
                }
            },
        };

        // Only add the voice option if a voice is selected
        // This ensures the system default voice is used when no voice is selected
        if (settings.voice) {
            speechOptions.voice = settings.voice;
        }

        // Speak with settings
        await Speech.speak(speakingText, speechOptions);

        return true;
    } catch (error) {
        console.error("Error speaking chunk:", error);
        return false;
    }
};

// Speak text with current settings
export const speakText = async (text, startSentenceIndex = 0) => {
    try {
        console.log(
            `speakText called with startSentenceIndex: ${startSentenceIndex}`
        );

        // Get current settings
        const settings = await getTTSSettings();

        // Stop any ongoing speech
        await stopSpeaking();

        // Reset chunking state
        isPlayingChunks = false;

        // Process the entire text first to get global sentence and word mapping
        globalProcessedText = processTextForSpeech(text);

        console.log(
            `Processed text has ${globalProcessedText.sentences.length} sentences`
        );

        // Validate the startSentenceIndex
        if (startSentenceIndex >= globalProcessedText.sentences.length) {
            console.warn(
                `Invalid startSentenceIndex: ${startSentenceIndex}, max: ${
                    globalProcessedText.sentences.length - 1
                }. Defaulting to 0.`
            );
            startSentenceIndex = 0;
        }

        // Split text into manageable chunks
        textChunks = splitTextIntoChunks(text);

        if (textChunks.length === 0) {
            console.error("No text to speak");
            return false;
        }

        // Calculate character offsets for each chunk and create sentence index mapping
        chunkOffsets = [];
        sentenceIndicesMap = {};
        let currentOffset = 0;

        // First, store all character offsets
        for (let i = 0; i < textChunks.length; i++) {
            chunkOffsets.push(currentOffset);
            currentOffset += textChunks[i].length;
        }

        // Now, for each chunk, determine which global sentences it contains
        for (let chunkIndex = 0; chunkIndex < textChunks.length; chunkIndex++) {
            const chunkStart = chunkOffsets[chunkIndex];
            const chunkEnd =
                chunkIndex < textChunks.length - 1
                    ? chunkOffsets[chunkIndex + 1]
                    : text.length;

            console.log(
                `Processing chunk ${chunkIndex}: chars ${chunkStart}-${chunkEnd}`
            );

            // Process this chunk to get its local sentences
            const chunkProcessed = processTextForSpeech(textChunks[chunkIndex]);
            console.log(
                `Chunk ${chunkIndex} has ${chunkProcessed.sentences.length} local sentences`
            );

            // For each sentence in the global text, check if it's in this chunk
            globalProcessedText.sentences.forEach(
                (sentence, globalSentenceIndex) => {
                    // Find the first word of this sentence in the global word map
                    const sentenceWords = globalProcessedText.wordMap.filter(
                        (w) => w.sentenceIndex === globalSentenceIndex
                    );

                    if (sentenceWords.length > 0) {
                        const firstWord = sentenceWords[0];

                        // Check if this sentence starts in the current chunk
                        if (
                            firstWord.startChar >= chunkStart &&
                            firstWord.startChar < chunkEnd
                        ) {
                            console.log(
                                `Global sentence ${globalSentenceIndex} starts in chunk ${chunkIndex} at char ${firstWord.startChar}`
                            );

                            // This sentence starts in this chunk
                            // Find the local sentence index
                            const localCharIndex =
                                firstWord.startChar - chunkStart;

                            // Find which local sentence this corresponds to
                            for (
                                let localSentenceIndex = 0;
                                localSentenceIndex <
                                chunkProcessed.sentences.length;
                                localSentenceIndex++
                            ) {
                                const localSentenceWords =
                                    chunkProcessed.wordMap.filter(
                                        (w) =>
                                            w.sentenceIndex ===
                                            localSentenceIndex
                                    );

                                if (localSentenceWords.length > 0) {
                                    const localFirstWord =
                                        localSentenceWords[0];

                                    // If this local sentence starts at or before our target position
                                    // and is the last such sentence, it's our match
                                    if (
                                        localFirstWord.startChar <=
                                        localCharIndex
                                    ) {
                                        // Check if there's a next sentence that's closer
                                        const nextLocalSentenceWords =
                                            chunkProcessed.wordMap.filter(
                                                (w) =>
                                                    w.sentenceIndex ===
                                                    localSentenceIndex + 1
                                            );

                                        if (
                                            nextLocalSentenceWords.length ===
                                                0 ||
                                            nextLocalSentenceWords[0]
                                                .startChar > localCharIndex
                                        ) {
                                            // This is the right local sentence
                                            // Map the global sentence index to this chunk and local sentence
                                            // Use the number as the key, not a string
                                            const key = globalSentenceIndex;

                                            if (!sentenceIndicesMap[key]) {
                                                sentenceIndicesMap[key] = {
                                                    chunkIndex,
                                                    localSentenceIndex,
                                                };

                                                console.log(
                                                    `Mapped global sentence ${key} to chunk ${chunkIndex}, local sentence ${localSentenceIndex}`
                                                );
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            );
        }

        // Set chunking state
        currentChunkIndex = 0;
        isPlayingChunks = true;

        // Determine which chunk contains the starting sentence
        let startChunkIndex = 0;
        let localStartSentenceIndex = 0;

        console.log(
            `Sentence indices map:`,
            JSON.stringify(sentenceIndicesMap)
        );

        if (startSentenceIndex > 0) {
            // Convert to number to ensure consistent key type
            const key = Number(startSentenceIndex);

            // Check if the key exists in the map
            if (sentenceIndicesMap.hasOwnProperty(key)) {
                startChunkIndex = sentenceIndicesMap[key].chunkIndex;
                localStartSentenceIndex =
                    sentenceIndicesMap[key].localSentenceIndex;
                console.log(
                    `Found mapping for sentence ${key}: chunk ${startChunkIndex}, local index ${localStartSentenceIndex}`
                );
            } else {
                console.warn(
                    `No mapping found for sentence index ${key}. Starting from the beginning.`
                );
                startSentenceIndex = 0;
            }
        } else {
            console.log(`Starting from the first sentence (index 0)`);
        }

        // Start speaking from the appropriate chunk
        currentChunkIndex = startChunkIndex;
        console.log(
            `Starting speech from chunk ${currentChunkIndex}, local sentence index ${localStartSentenceIndex}`
        );

        const success = await speakChunk(
            textChunks[currentChunkIndex],
            settings,
            localStartSentenceIndex,
            textChunks.length === 1 ||
                currentChunkIndex === textChunks.length - 1,
            startSentenceIndex
        );

        console.log(`speakChunk result: ${success}`);

        return success;
    } catch (error) {
        console.error("Error speaking text:", error);
        isPlayingChunks = false;
        return false;
    }
};

// Stop speaking
export const stopSpeaking = async () => {
    try {
        // Stop the chunking process
        isPlayingChunks = false;

        // Reset global state
        currentChunkIndex = 0;
        textChunks = [];
        chunkOffsets = [];
        sentenceIndicesMap = {};
        // Don't reset globalProcessedText as it might be needed for UI highlighting

        // Stop any ongoing speech
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
