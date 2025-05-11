import React from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import PropTypes from 'prop-types';
import { COLORS, SPACING } from '../../constants';
import MessageItem from './MessageItem';
import EmptyState from './EmptyState';

/**
 * Component to render the list of messages in the chat
 * 
 * @param {Object} props - Component props
 * @param {Array} props.messages - Array of message objects
 * @param {Object} props.flatListRef - Ref for the FlatList
 * @param {Function} props.onLongPress - Function to handle long press on a message
 * @param {Function} props.onSpeakMessage - Function to handle TTS button press
 * @param {boolean} props.isPlayingTTS - Whether TTS is currently playing
 * @param {string} props.speakingMessageId - ID of the message currently being spoken
 * @param {Object} props.processedTexts - Object containing processed text for TTS
 * @param {Object} props.currentWord - Current word being spoken
 * @param {number} props.currentSentence - Current sentence being spoken
 * @param {Function} props.formatDateWithTimeZone - Function to format date with timezone
 * @param {Object} props.markdownStyles - Styles for markdown rendering
 * @param {Object} props.messageRefs - Refs for messages
 * @param {Object} props.sentenceRefs - Refs for sentences
 * @param {Object} props.wordRefs - Refs for words
 * @returns {React.ReactElement} MessageList component
 */
const MessageList = ({
  messages,
  flatListRef,
  onLongPress,
  onSpeakMessage,
  isPlayingTTS,
  speakingMessageId,
  processedTexts,
  currentWord,
  currentSentence,
  formatDateWithTimeZone,
  markdownStyles,
  messageRefs,
  sentenceRefs,
  wordRefs,
}) => {
  const renderItem = ({ item }) => (
    <MessageItem
      item={item}
      onLongPress={onLongPress}
      onSpeakMessage={onSpeakMessage}
      isPlayingTTS={isPlayingTTS}
      speakingMessageId={speakingMessageId}
      processedTexts={processedTexts}
      currentWord={currentWord}
      currentSentence={currentSentence}
      formatDate={formatDateWithTimeZone}
      markdownStyles={markdownStyles}
      sentenceRefs={sentenceRefs}
      wordRefs={wordRefs}
    />
  );

  return (
    <View style={styles.messagesContainer}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item.id || `message-${index}-${Date.now()}`
        }
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={<EmptyState />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ flex: 1 }}
      />
    </View>
  );
};

MessageList.propTypes = {
  messages: PropTypes.array.isRequired,
  flatListRef: PropTypes.object.isRequired,
  onLongPress: PropTypes.func.isRequired,
  onSpeakMessage: PropTypes.func.isRequired,
  isPlayingTTS: PropTypes.bool.isRequired,
  speakingMessageId: PropTypes.string,
  processedTexts: PropTypes.object.isRequired,
  currentWord: PropTypes.object,
  currentSentence: PropTypes.number.isRequired,
  formatDateWithTimeZone: PropTypes.func.isRequired,
  markdownStyles: PropTypes.object.isRequired,
  messageRefs: PropTypes.object.isRequired,
  sentenceRefs: PropTypes.object.isRequired,
  wordRefs: PropTypes.object.isRequired,
};

const styles = StyleSheet.create({
  messagesContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  messageList: {
    padding: SPACING.md,
    flexGrow: 1,
  },
});

export default MessageList;
