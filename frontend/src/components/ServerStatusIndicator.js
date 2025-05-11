/**
 * ServerStatusIndicator Component
 * 
 * A subtle UI indicator that shows the backend server connection status.
 * This component is designed to be non-intrusive and only appears briefly
 * during the connection process or when there's an issue.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const ServerStatusIndicator = ({ status, message, autoHide = true }) => {
  const [visible, setVisible] = useState(false);
  const translateY = new Animated.Value(-50);
  
  // Determine icon and color based on status
  let iconName = 'server-outline';
  let backgroundColor = COLORS.primary;
  
  switch (status) {
    case 'connecting':
      iconName = 'sync-outline';
      backgroundColor = COLORS.warning;
      break;
    case 'connected':
      iconName = 'checkmark-circle-outline';
      backgroundColor = COLORS.success;
      break;
    case 'retrying':
      iconName = 'refresh-outline';
      backgroundColor = COLORS.warning;
      break;
    case 'failed':
      iconName = 'alert-circle-outline';
      backgroundColor = COLORS.error;
      break;
    default:
      iconName = 'server-outline';
      backgroundColor = COLORS.primary;
  }
  
  useEffect(() => {
    if (status) {
      // Show the indicator
      setVisible(true);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      // Auto-hide after 3 seconds if status is 'connected' and autoHide is true
      if (status === 'connected' && autoHide) {
        const timer = setTimeout(() => {
          Animated.timing(translateY, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
          });
        }, 3000);
        
        return () => clearTimeout(timer);
      }
      
      // Auto-hide after 5 seconds if status is 'failed' and autoHide is true
      if (status === 'failed' && autoHide) {
        const timer = setTimeout(() => {
          Animated.timing(translateY, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            setVisible(false);
          });
        }, 5000);
        
        return () => clearTimeout(timer);
      }
    } else {
      // Hide the indicator if no status
      Animated.timing(translateY, {
        toValue: -50,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setVisible(false);
      });
    }
  }, [status, autoHide]);
  
  if (!visible && !status) return null;
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [{ translateY }],
          backgroundColor
        }
      ]}
    >
      <Ionicons 
        name={iconName}
        size={16} 
        color="#FFFFFF" 
      />
      <Text style={styles.text}>{message || 'Connecting to server...'}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  text: {
    color: '#FFFFFF',
    marginLeft: 5,
    fontWeight: '500',
    fontSize: 12,
  },
});

export default ServerStatusIndicator;
