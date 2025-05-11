import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../../constants';

/**
 * Component to display an offline banner
 * 
 * @returns {React.ReactElement} OfflineBanner component
 */
const OfflineBanner = () => {
  return (
    <View style={styles.offlineBanner}>
      <Ionicons
        name="cloud-offline-outline"
        size={16}
        color={COLORS.error}
      />
      <Text style={styles.offlineBannerText}>
        You're offline. Questions will be answered when you're back online.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.error + '20', // 20% opacity
    padding: SPACING.xs,
    borderRadius: 8,
    marginBottom: SPACING.xs,
    width: '100%',
  },
  offlineBannerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    marginLeft: SPACING.xs,
    flex: 1,
  },
});

export default OfflineBanner;
