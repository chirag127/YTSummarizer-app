import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";

// Define theme storage key
const THEME_SETTINGS_KEY = "theme_settings";

// Define theme types
export const THEME_TYPES = {
    LIGHT: "light",
    DARK: "dark",
    AMOLED: "amoled",
};

// Light theme colors
const lightTheme = {
    primary: "#4285F4", // Google Blue
    secondary: "#34A853", // Google Green
    accent: "#FBBC05", // Google Yellow
    warning: "#FBBC05", // Google Yellow (same as accent)
    error: "#EA4335", // Google Red
    success: "#34A853", // Google Green
    background: "#FFFFFF", // White
    surface: "#F8F9FA", // Light Gray
    text: "#202124", // Dark Gray
    textSecondary: "#5F6368", // Medium Gray
    border: "#DADCE0", // Light Border
    disabled: "#E8EAED", // Disabled Gray
    infoBackground: "#E8F0FE", // Light Blue Background
    card: "#FFFFFF", // Card background
    statusBar: "dark", // StatusBar style
};

// Dark theme colors
const darkTheme = {
    primary: "#8AB4F8", // Lighter Google Blue for dark mode
    secondary: "#81C995", // Lighter Google Green for dark mode
    accent: "#FDD663", // Lighter Google Yellow for dark mode
    warning: "#FDD663", // Lighter Google Yellow for dark mode
    error: "#F28B82", // Lighter Google Red for dark mode
    success: "#81C995", // Lighter Google Green for dark mode
    background: "#202124", // Dark Gray
    surface: "#303134", // Medium Dark Gray
    text: "#E8EAED", // Light Gray
    textSecondary: "#9AA0A6", // Medium Light Gray
    border: "#5F6368", // Medium Gray
    disabled: "#3C4043", // Dark Gray
    infoBackground: "#1F3058", // Dark Blue Background
    card: "#303134", // Card background
    statusBar: "light", // StatusBar style
};

// AMOLED dark theme colors (true black)
const amoledTheme = {
    primary: "#8AB4F8", // Lighter Google Blue for dark mode
    secondary: "#81C995", // Lighter Google Green for dark mode
    accent: "#FDD663", // Lighter Google Yellow for dark mode
    warning: "#FDD663", // Lighter Google Yellow for dark mode
    error: "#F28B82", // Lighter Google Red for dark mode
    success: "#81C995", // Lighter Google Green for dark mode
    background: "#000000", // True Black
    surface: "#121212", // Very Dark Gray (almost black)
    text: "#FFFFFF", // White
    textSecondary: "#9AA0A6", // Medium Light Gray
    border: "#5F6368", // Medium Gray
    disabled: "#3C4043", // Dark Gray
    infoBackground: "#121212", // Very Dark Blue Background
    card: "#121212", // Card background
    statusBar: "light", // StatusBar style
};

// Create the context
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Provider component
export const ThemeProvider = ({ children }) => {
    // Get device color scheme
    const deviceTheme = useColorScheme();
    
    // State for theme settings
    const [themeSettings, setThemeSettings] = useState({
        themeType: deviceTheme === "dark" ? THEME_TYPES.DARK : THEME_TYPES.LIGHT, // Default to device theme
        useDeviceTheme: true, // Default to using device theme
    });

    // Get current theme colors based on settings
    const getCurrentThemeColors = () => {
        if (themeSettings.useDeviceTheme) {
            return deviceTheme === "dark" ? darkTheme : lightTheme;
        }

        switch (themeSettings.themeType) {
            case THEME_TYPES.DARK:
                return darkTheme;
            case THEME_TYPES.AMOLED:
                return amoledTheme;
            case THEME_TYPES.LIGHT:
            default:
                return lightTheme;
        }
    };

    // State for current theme colors
    const [colors, setColors] = useState(getCurrentThemeColors());

    // Load theme settings from storage
    useEffect(() => {
        const loadThemeSettings = async () => {
            try {
                const storedSettings = await AsyncStorage.getItem(THEME_SETTINGS_KEY);
                if (storedSettings) {
                    const parsedSettings = JSON.parse(storedSettings);
                    setThemeSettings(parsedSettings);
                }
            } catch (error) {
                console.error("Error loading theme settings:", error);
            }
        };

        loadThemeSettings();
    }, []);

    // Update colors when theme settings or device theme changes
    useEffect(() => {
        setColors(getCurrentThemeColors());
    }, [themeSettings, deviceTheme]);

    // Save theme settings to storage
    const saveThemeSettings = async (settings) => {
        try {
            await AsyncStorage.setItem(THEME_SETTINGS_KEY, JSON.stringify(settings));
            setThemeSettings(settings);
        } catch (error) {
            console.error("Error saving theme settings:", error);
        }
    };

    // Update theme settings
    const updateThemeSettings = (settings) => {
        saveThemeSettings({
            ...themeSettings,
            ...settings,
        });
    };

    // Get current theme type
    const getCurrentThemeType = () => {
        if (themeSettings.useDeviceTheme) {
            return deviceTheme === "dark" ? THEME_TYPES.DARK : THEME_TYPES.LIGHT;
        }
        return themeSettings.themeType;
    };

    // Context value
    const value = {
        colors,
        themeSettings,
        updateThemeSettings,
        getCurrentThemeType,
        themeTypes: THEME_TYPES,
    };

    return (
        <ThemeContext.Provider value={value}>
            <StatusBar style={colors.statusBar} />
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;
