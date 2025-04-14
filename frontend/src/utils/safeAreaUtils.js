import { Platform, Dimensions } from 'react-native';

// Default insets for different platforms
const DEFAULT_INSETS = {
  top: Platform.OS === 'ios' ? 44 : 24,
  right: 0,
  bottom: Platform.OS === 'ios' ? 34 : 0,
  left: 0,
};

// Get safe area insets based on device dimensions and platform
export const getSafeAreaInsets = () => {
  const { height, width } = Dimensions.get('window');
  
  // Adjust insets based on device dimensions
  let insets = { ...DEFAULT_INSETS };
  
  // iPhone X and newer (or similar aspect ratio devices)
  if (Platform.OS === 'ios' && (height / width > 2 || width / height > 2)) {
    insets.top = 44;
    insets.bottom = 34;
  }
  
  return insets;
};

// Create a padding object from insets for use in styles
export const getSafeAreaPadding = () => {
  const insets = getSafeAreaInsets();
  return {
    paddingTop: insets.top,
    paddingRight: insets.right,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
  };
};
