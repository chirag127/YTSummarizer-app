import React, { useRef, forwardRef, useImperativeHandle } from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import Markdown from "react-native-markdown-display";
import PropTypes from "prop-types";

import { COLORS, SPACING, FONT_SIZES } from "../../constants";

/**
 * SummaryContent component displays the summary content with TTS highlighting
 *
 * @param {Object} props
 * @param {string} props.summaryText - The summary text in markdown format
 * @param {boolean} props.isPlaying - Whether TTS is currently playing
 * @param {boolean} props.showPlainText - Whether to show plain text instead of markdown
 * @param {Object} props.processedText - The processed text object with sentences and words
 * @param {number} props.currentSentence - The index of the current sentence being spoken
 * @param {Object} props.currentWord - The current word being spoken
 * @param {Object} props.scrollViewRef - Ref to the parent ScrollView
 */
const SummaryContent = forwardRef(
    (
        {
            summaryText,
            isPlaying,
            showPlainText,
            processedText,
            currentSentence,
            currentWord,
            scrollViewRef,
        },
        ref
    ) => {
        // Refs for sentence elements
        const sentenceRefs = useRef({});

        // Expose the sentenceRefs to the parent component
        useImperativeHandle(ref, () => ({
            sentenceRefs: sentenceRefs.current,
        }));

        return (
            <View style={styles.summaryContentContainer}>
                <Text style={styles.summaryTitle}>Summary</Text>

                {/* Render highlighted text when playing TTS or when showPlainText is true */}
                {(isPlaying || showPlainText) &&
                processedText &&
                processedText.sentences ? (
                    <View>
                        {processedText.sentences.map((sentence, index) => (
                            <View
                                key={`sentence-${index}`}
                                ref={(ref) =>
                                    (sentenceRefs.current[index] = ref)
                                }
                                style={[
                                    styles.sentenceContainer,
                                    currentSentence === index &&
                                        styles.activeSentence,
                                ]}
                            >
                                {sentence &&
                                sentence.words &&
                                Array.isArray(sentence.words) ? (
                                    sentence.words.map((word, wordIndex) => (
                                        <Text
                                            key={`word-${index}-${wordIndex}`}
                                            style={[
                                                styles.word,
                                                currentWord &&
                                                    currentWord.sentenceIndex ===
                                                        index &&
                                                    currentWord.wordIndex ===
                                                        wordIndex &&
                                                    styles.activeWord,
                                            ]}
                                        >
                                            {word}
                                            {wordIndex <
                                            sentence.words.length - 1
                                                ? " "
                                                : ""}
                                        </Text>
                                    ))
                                ) : (
                                    <Text style={styles.word}>
                                        {sentence?.text || ""}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                ) : (
                    // Render markdown when not playing TTS and not showing plain text
                    <Markdown style={markdownStyles}>{summaryText}</Markdown>
                )}
            </View>
        );
    }
);

SummaryContent.propTypes = {
    summaryText: PropTypes.string.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    showPlainText: PropTypes.bool.isRequired,
    processedText: PropTypes.shape({
        sentences: PropTypes.array,
    }),
    currentSentence: PropTypes.number.isRequired,
    currentWord: PropTypes.object,
    scrollViewRef: PropTypes.object.isRequired,
};

// Set display name for the forwardRef component
SummaryContent.displayName = "SummaryContent";

const styles = StyleSheet.create({
    summaryContentContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    summaryTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: "bold",
        color: COLORS.text,
        marginBottom: SPACING.md,
    },
    sentenceContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        marginBottom: SPACING.md,
    },
    activeSentence: {
        backgroundColor: "rgba(0, 123, 255, 0.05)",
        borderRadius: 4,
        padding: SPACING.xs,
    },
    word: {
        fontSize: FONT_SIZES.md,
        color: COLORS.text,
        lineHeight: 22,
    },
    activeWord: {
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        borderRadius: 2,
    },
});

// Markdown styles
const markdownStyles = {
    body: {
        color: COLORS.text,
        fontSize: FONT_SIZES.md,
    },
    heading1: {
        fontSize: FONT_SIZES.xxl,
        fontWeight: "bold",
        color: COLORS.text,
        marginTop: SPACING.lg,
        marginBottom: SPACING.md,
    },
    heading2: {
        fontSize: FONT_SIZES.xl,
        fontWeight: "bold",
        color: COLORS.text,
        marginTop: SPACING.lg,
        marginBottom: SPACING.md,
    },
    heading3: {
        fontSize: FONT_SIZES.lg,
        fontWeight: "bold",
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
    code_block: {
        backgroundColor: COLORS.codeBackground,
        padding: SPACING.sm,
        borderRadius: 4,
        fontFamily: "monospace",
        marginBottom: SPACING.md,
    },
    code_inline: {
        backgroundColor: COLORS.codeBackground,
        padding: 2,
        borderRadius: 2,
        fontFamily: "monospace",
    },
    blockquote: {
        borderLeftWidth: 4,
        borderLeftColor: COLORS.primary,
        paddingLeft: SPACING.md,
        marginLeft: SPACING.sm,
        marginBottom: SPACING.md,
        opacity: 0.8,
    },
    link: {
        color: COLORS.primary,
        textDecorationLine: "underline",
    },
    image: {
        width: "100%",
        height: 200,
        resizeMode: "contain",
        marginVertical: SPACING.md,
    },
    table: {
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: SPACING.md,
    },
    thead: {
        backgroundColor: COLORS.surface,
    },
    th: {
        padding: SPACING.sm,
        fontWeight: "bold",
    },
    td: {
        padding: SPACING.sm,
    },
    hr: {
        backgroundColor: COLORS.border,
        height: 1,
        marginVertical: SPACING.md,
    },
};

export default SummaryContent;
