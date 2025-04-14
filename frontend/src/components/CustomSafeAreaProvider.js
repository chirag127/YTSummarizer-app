import React from 'react';
import { View, StyleSheet } from 'react-native';

// A simple custom implementation to replace SafeAreaProvider
const CustomSafeAreaProvider = ({ children }) => {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default CustomSafeAreaProvider;
