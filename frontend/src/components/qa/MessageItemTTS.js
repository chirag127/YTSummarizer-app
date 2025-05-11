import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

/**
 * Component to render a message with TTS highlighting
 * 
 * @param {Object} props - Component props
 * @param {Object} props.message - Message object
 * @param {Object} props.processedText - Processed text for TTS
 * @param {number} props.currentSentence - Current sentence being spoken
 * @param {Object} props.currentWord - Current word being spoken
 * @param {Object} props.sentenceRefs - Refs for sentences
 * @param {Object} props.wordRefs - Refs for words
 * @returns {React.ReactElement} MessageItemTTS component
 */
const MessageItemTTS = ({
  message,
  processedText,
  currentSentence,
  currentWord,
  sentenceRefs,
  wordRefs
}) => {
  return (
    <View>
      {processedText.sentences.map((sentence, sentenceIndex) => (
        <View
          key={`sentence-${message.id}-${sentenceIndex}`}
          ref={(ref) => {
            sentenceRefs.current[
              `${message.id}-${sentenceIndex}`
            ] = ref;
          }}
          style={[
            styles.sentenceContainer,
            currentSentence === sentenceIndex &&
              styles.activeSentence,
          ]}
        >
          {sentence
            .split(/\s+/)
            .map((word, wordIdx) => {
              // Skip empty words
              if (word.trim() === "")
                return null;

              // Check if this word should be highlighted
              const isHighlighted =
                currentWord &&
                currentWord.sentenceIndex ===
                  sentenceIndex &&
                currentWord.wordIndex ===
                  wordIdx;

              return (
                <Text
                  key={`word-${message.id}-${sentenceIndex}-${wordIdx}`}
                  ref={(ref) => {
                    if (isHighlighted) {
                      // Store ref for the highlighted word
                      wordRefs.current[
                        `${message.id}-${sentenceIndex}-${wordIdx}`
                      ] = ref;
                    }
                  }}
                  style={[
                    styles.word,
                    isHighlighted &&
                      styles.highlightedWord,
                  ]}
                >
                  {word}{" "}
                </Text>
              );
            })}
        </View>
      ))}
    </View>
  );
};

MessageItemTTS.propTypes = {
  message: PropTypes.object.isRequired,
  processedText: PropTypes.object.isRequired,
  currentSentence: PropTypes.number.isRequired,
  currentWord: PropTypes.object,
  sentenceRefs: PropTypes.object.isRequired,
  wordRefs: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  sentenceContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
  },
  activeSentence: {
    backgroundColor: 'rgba(0, 123, 255, 0.05)',
    borderRadius: 4,
    padding: SPACING.xs,
  },
  word: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  highlightedWord: {
    backgroundColor: 'rgba(0, 123, 255, 0.4)',
    borderRadius: 4,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default MessageItemTTS;
