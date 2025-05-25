/**
 * StyleSheet Polyfill for JSC/Hermes compatibility
 * This ensures StyleSheet works correctly regardless of the JS engine
 */

import { StyleSheet as RNStyleSheet } from 'react-native';

// Create a safe StyleSheet implementation
const StyleSheet = {
    create: (styles) => {
        try {
            // Try the native StyleSheet.create first
            return RNStyleSheet.create(styles);
        } catch (error) {
            console.warn('StyleSheet.create failed, using fallback:', error.message);
            
            // Fallback: return the styles object directly
            // This works because React Native can accept plain style objects
            const processedStyles = {};
            
            for (const [key, value] of Object.entries(styles)) {
                if (typeof value === 'object' && value !== null) {
                    processedStyles[key] = { ...value };
                } else {
                    processedStyles[key] = value;
                }
            }
            
            return processedStyles;
        }
    },
    
    // Pass through other StyleSheet methods
    flatten: RNStyleSheet.flatten,
    compose: RNStyleSheet.compose,
    hairlineWidth: RNStyleSheet.hairlineWidth,
    absoluteFill: RNStyleSheet.absoluteFill,
    absoluteFillObject: RNStyleSheet.absoluteFillObject,
};

export default StyleSheet;
