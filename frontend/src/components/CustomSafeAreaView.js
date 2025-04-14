import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getSafeAreaPadding } from '../utils/safeAreaUtils';

const CustomSafeAreaView = ({ children, style, ...props }) => {
  const safeAreaPadding = getSafeAreaPadding();
  
  return (
    <View style={[styles.container, safeAreaPadding, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default CustomSafeAreaView;
