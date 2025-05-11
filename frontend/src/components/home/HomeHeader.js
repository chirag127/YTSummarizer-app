import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import PropTypes from 'prop-types';

import { COLORS, SPACING, FONT_SIZES } from '../../constants';

/**
 * HomeHeader component displays the title and subtitle for the HomeScreen
 * 
 * @returns {React.ReactElement} HomeHeader component
 */
const HomeHeader = () => {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>YouTube Summarizer</Text>
      <Text style={styles.subtitle}>
        Get AI-powered summaries of YouTube videos
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default React.memo(HomeHeader);
