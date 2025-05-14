import React, {
    useRef,
    forwardRef,
    useImperativeHandle,
    useState,
} from "react";
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
} from "react-native";
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
 * @param {Function} props.onSentenceTap - Function to handle when a sentence is double-tapped
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
            onSentenceTap,
        },
        ref
    ) => {
        // Refs for sentence elements
        const sentenceRefs = useRef({});
        // State for tracking the last tap time for each sentence
        const [lastTapTimes, setLastTapTimes] = useState({});
        // State for tracking which sentence is being highlighted from a tap
        const [tappedSentence, setTappedSentence] = useState(null);

        // Expose the sentenceRefs to the parent component
        useImperativeHandle(ref, () => ({
            sentenceRefs: sentenceRefs.current,
        }));

        // Handle tap on a sentence
        const handleSentenceTap = (sentenceIndex) => {
            console.log(`Tap detected on sentence ${sentenceIndex}`);

            const now = Date.now();
            const lastTap = lastTapTimes[sentenceIndex] || 0;
            const doubleTapDelay = 300; // ms between taps to consider it a double tap

            // Update the last tap time for this sentence
            setLastTapTimes((prev) => ({
                ...prev,
                [sentenceIndex]: now,
            }));

            // Check if this is a double tap (two taps within doubleTapDelay ms)
            if (now - lastTap < doubleTapDelay) {
                console.log(
                    `Double tap confirmed on sentence ${sentenceIndex}`
                );

                // It's a double tap
                // Provide visual feedback
                setTappedSentence(sentenceIndex);

                // Reset the tapped sentence after a short delay
                setTimeout(() => {
                    setTappedSentence(null);
                }, 300);

                // Call the callback with the sentence index
                if (onSentenceTap) {
                    // Ensure we're passing the correct index
                    console.log(
                        `Calling onSentenceTap with index: ${sentenceIndex}`
                    );
                    onSentenceTap(sentenceIndex);
                } else {
                    console.warn("onSentenceTap callback is not defined");
                }
            }
        };

        // Wrapper component for sentences with tap detection
        const SentenceWrapper = ({ children, sentenceIndex }) => {
            // Determine if this sentence should be highlighted
            const isActive = currentSentence === sentenceIndex;
            const isTapped = tappedSentence === sentenceIndex;

            return (
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleSentenceTap(sentenceIndex)}
                    delayPressIn={0}
                >
                    <View
                        ref={(ref) =>
                            (sentenceRefs.current[sentenceIndex] = ref)
                        }
                        style={[
                            styles.sentenceContainer,
                            isActive && styles.activeSentence,
                            isTapped && styles.tappedSentence,
                        ]}
                        accessible={true}
                        accessibilityRole="text"
                        accessibilityHint="Double tap to start reading from this sentence"
                    >
                        {children}
                    </View>
                </TouchableOpacity>
            );
        };

        return (
            <View style={styles.summaryContentContainer}>
                <Text style={styles.summaryTitle}>Summary</Text>

                {/* Render highlighted text when playing TTS or when showPlainText is true */}
                {(isPlaying || showPlainText) &&
                processedText &&
                processedText.sentences ? (
                    <View>
                        {processedText.sentences.map((sentence, index) => (
                            <SentenceWrapper
                                key={`sentence-${index}`}
                                sentenceIndex={index}
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
                            </SentenceWrapper>
                        ))}
                    </View>
                ) : (
                    // Render markdown when not playing TTS and not showing plain text
                    <View>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                                console.log("Tap on markdown view");
                                handleSentenceTap(0);
                            }}
                            accessible={true}
                            accessibilityHint="Double tap to start reading from the beginning"
                        >
                            <Markdown style={markdownStyles}>
                                {summaryText}
                            </Markdown>
                        </TouchableOpacity>
                    </View>
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
    onSentenceTap: PropTypes.func,
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
        padding: SPACING.xs,
        borderRadius: 4,
    },
    activeSentence: {
        backgroundColor: "rgba(0, 123, 255, 0.05)",
    },
    tappedSentence: {
        backgroundColor: "rgba(0, 123, 255, 0.3)",
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
