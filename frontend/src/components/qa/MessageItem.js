import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import Markdown from "react-native-markdown-display";
import { COLORS, SPACING, FONT_SIZES } from "../../constants";

/**
 * MessageItem component for rendering a message in the QA screen
 * 
 * @param {object} item - Message object to render
 * @param {function} onLongPress - Function to call when message is long pressed
 * @param {function} onSpeakMessage - Function to call when speak button is pressed
 * @param {boolean} isPlayingTTS - Whether TTS is currently playing
 * @param {string} speakingMessageId - ID of the message currently being spoken
 * @param {object} processedTexts - Object containing processed text for TTS
 * @param {object} currentWord - Current word being spoken
 * @param {number} currentSentence - Current sentence being spoken
 * @param {function} formatDate - Function to format date
 * @param {object} markdownStyles - Styles for markdown rendering
 * @param {object} sentenceRefs - Refs for sentences
 * @param {object} wordRefs - Refs for words
 */
const MessageItem = ({
  item,
  onLongPress,
  onSpeakMessage,
  isPlayingTTS,
  speakingMessageId,
  processedTexts,
  currentWord,
  currentSentence,
  formatDate,
  markdownStyles,
  sentenceRefs,
  wordRefs,
}) => {
  // Determine if this is a user message
  const isUserMessage = item.role === "user";

  // Check if this message is currently being spoken
  const isBeingSpoken = speakingMessageId === item.id && isPlayingTTS;

  // Get the processed text for this message if it's being spoken
  const processedText = processedTexts[item.id];

  return (
    <TouchableOpacity
      style={[
        styles.messageContainer,
        isUserMessage ? styles.userMessage : styles.aiMessage,
        item.isOffline && styles.offlineMessage,
        isBeingSpoken && styles.speakingMessage,
      ]}
      onLongPress={() => onLongPress(item.content)}
    >
      <View style={styles.messageContentContainer}>
        {isUserMessage ? (
          <Text style={[styles.messageText, styles.userMessageText]}>
            {item.content}
          </Text>
        ) : isBeingSpoken && processedText ? (
          // Render with word highlighting when being spoken
          <View>
            {processedText.sentences.map((sentence, sentenceIndex) => (
              <View
                key={`sentence-${item.id}-${sentenceIndex}`}
                ref={(ref) => {
                  sentenceRefs.current[`${item.id}-${sentenceIndex}`] = ref;
                }}
                style={[
                  styles.sentenceContainer,
                  currentSentence === sentenceIndex && styles.activeSentence,
                ]}
              >
                {sentence.words.map((word, wordIndex) => (
                  <Text
                    key={`word-${item.id}-${sentenceIndex}-${wordIndex}`}
                    ref={(ref) => {
                      wordRefs.current[
                        `${item.id}-${sentenceIndex}-${wordIndex}`
                      ] = ref;
                    }}
                    style={[
                      styles.word,
                      currentWord &&
                        currentWord.sentenceIndex === sentenceIndex &&
                        currentWord.wordIndex === wordIndex &&
                        styles.highlightedWord,
                    ]}
                  >
                    {word}
                    {wordIndex < sentence.words.length - 1 ? " " : ""}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        ) : (
          // Render as markdown when not being spoken
          <Markdown style={markdownStyles}>{item.content}</Markdown>
        )}
      </View>
      <View style={styles.messageFooter}>
        {item.isOffline && (
          <View style={styles.offlineIndicator}>
            <Ionicons
              name="cloud-offline-outline"
              size={16}
              color={COLORS.error}
            />
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
        <Text style={styles.timestamp}>
          {formatDate(item.timestamp)}
        </Text>

        {/* Only show TTS button for AI messages */}
        {!isUserMessage && (
          <TouchableOpacity
            style={styles.ttsButton}
            onPress={() => onSpeakMessage(item)}
          >
            <Ionicons
              name={isBeingSpoken ? "pause" : "volume-high"}
              size={18}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

MessageItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string,
    content: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    isOffline: PropTypes.bool,
  }).isRequired,
  onLongPress: PropTypes.func.isRequired,
  onSpeakMessage: PropTypes.func.isRequired,
  isPlayingTTS: PropTypes.bool.isRequired,
  speakingMessageId: PropTypes.string,
  processedTexts: PropTypes.object.isRequired,
  currentWord: PropTypes.object,
  currentSentence: PropTypes.number.isRequired,
  formatDate: PropTypes.func.isRequired,
  markdownStyles: PropTypes.object.isRequired,
  sentenceRefs: PropTypes.object.isRequired,
  wordRefs: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: SPACING.sm,
    borderRadius: 8,
    padding: SPACING.md,
    maxWidth: "90%",
    alignSelf: "flex-start",
  },
  userMessage: {
    backgroundColor: COLORS.primary,
    alignSelf: "flex-end",
  },
  aiMessage: {
    backgroundColor: COLORS.surface,
  },
  offlineMessage: {
    borderWidth: 1,
    borderColor: COLORS.error + "40", // 40% opacity
  },
  speakingMessage: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  messageContentContainer: {
    marginBottom: SPACING.xs,
  },
  messageText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  userMessageText: {
    color: COLORS.background,
  },
  messageFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: SPACING.xs,
  },
  timestamp: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    opacity: 0.8,
  },
  offlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: SPACING.sm,
  },
  offlineText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginLeft: 2,
  },
  ttsButton: {
    padding: SPACING.xs,
  },
  sentenceContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: SPACING.xs,
  },
  activeSentence: {
    backgroundColor: "rgba(0, 123, 255, 0.05)",
    borderRadius: 4,
    padding: SPACING.xs,
  },
  word: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  highlightedWord: {
    backgroundColor: "rgba(0, 123, 255, 0.4)",
    borderRadius: 4,
    fontWeight: "600",
    color: COLORS.primary,
  },
});

export default MessageItem;
