import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

/**
 * Custom hook for creating themed styles
 * @param {Function} styleCreator - Function that takes colors and returns style object
 * @returns {Object} - StyleSheet object with theme colors applied
 * 
 * Example usage:
 * 
 * const styles = useThemedStyles((colors) => ({
 *   container: {
 *     backgroundColor: colors.background,
 *   },
 *   text: {
 *     color: colors.text,
 *   },
 * }));
 */
const useThemedStyles = (styleCreator) => {
  const { colors } = useTheme();
  
  // Memoize styles to prevent unnecessary re-renders
  return useMemo(() => {
    const styleObject = styleCreator(colors);
    return StyleSheet.create(styleObject);
  }, [colors, styleCreator]);
};

export default useThemedStyles;
