import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropTypes from "prop-types";
import Markdown from "react-native-markdown-display";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

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
    // Get theme colors
    const { colors } = useTheme();

    // Determine if this is a user message
    const isUserMessage = item.role === "user";

    // Check if this message is currently being spoken
    const isBeingSpoken = speakingMessageId === item.id && isPlayingTTS;

    // Get the processed text for this message if it's being spoken
    const processedText = processedTexts[item.id];

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        messageContainer: {
            marginVertical: SPACING.sm,
            borderRadius: 8,
            padding: SPACING.md,
            maxWidth: "90%",
            alignSelf: "flex-start",
        },
        userMessage: {
            backgroundColor: colors.primary,
            alignSelf: "flex-end",
        },
        aiMessage: {
            backgroundColor: colors.surface,
        },
        offlineMessage: {
            borderWidth: 1,
            borderColor: colors.error + "40", // 40% opacity
        },
        speakingMessage: {
            borderWidth: 1,
            borderColor: colors.primary,
        },
        messageContentContainer: {
            marginBottom: SPACING.xs,
        },
        messageText: {
            fontSize: FONT_SIZES.md,
            color: colors.text,
        },
        userMessageText: {
            color: colors.background,
        },
        messageFooter: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: SPACING.xs,
        },
        timestamp: {
            fontSize: FONT_SIZES.xs,
            color: colors.textSecondary,
            opacity: 0.8,
        },
        offlineIndicator: {
            flexDirection: "row",
            alignItems: "center",
            marginRight: SPACING.sm,
        },
        offlineText: {
            fontSize: FONT_SIZES.xs,
            color: colors.error,
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
            backgroundColor: `${colors.primary}10`, // 10% opacity
            borderRadius: 4,
            padding: SPACING.xs,
        },
        word: {
            fontSize: FONT_SIZES.md,
            color: colors.text,
        },
        highlightedWord: {
            backgroundColor: `${colors.primary}40`, // 40% opacity
            borderRadius: 4,
            fontWeight: "600",
            color: colors.primary,
        },
    }));

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
                        {processedText.sentences.map(
                            (sentence, sentenceIndex) => (
                                <View
                                    key={`sentence-${item.id}-${sentenceIndex}`}
                                    ref={(ref) => {
                                        sentenceRefs.current[
                                            `${item.id}-${sentenceIndex}`
                                        ] = ref;
                                    }}
                                    style={[
                                        styles.sentenceContainer,
                                        currentSentence === sentenceIndex &&
                                            styles.activeSentence,
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
                                                    currentWord.sentenceIndex ===
                                                        sentenceIndex &&
                                                    currentWord.wordIndex ===
                                                        wordIndex &&
                                                    styles.highlightedWord,
                                            ]}
                                        >
                                            {word}
                                            {wordIndex <
                                            sentence.words.length - 1
                                                ? " "
                                                : ""}
                                        </Text>
                                    ))}
                                </View>
                            )
                        )}
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
                            color={colors.error}
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
                            color={colors.primary}
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

export default MessageItem;
