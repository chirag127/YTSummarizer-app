// export const API_BASE_URL = "https://ytsummarizer2-react-native-expo-app.onrender.com";
export const API_BASE_URL = "http://192.168.31.232:8000";


// Summary Types
export const SUMMARY_TYPES = [
    { id: "Brief", label: "Brief" },
    { id: "Detailed", label: "Detailed" },
    { id: "Key Point", label: "Key Points" },
    { id: "Chapters", label: "Chapters" },
];

// Summary Lengths
export const SUMMARY_LENGTHS = [
    { id: "Short", label: "Short" },
    { id: "Medium", label: "Medium" },
    { id: "Long", label: "Long" },
];

// Colors
export const COLORS = {
    primary: "#4285F4", // Google Blue
    secondary: "#34A853", // Google Green
    accent: "#FBBC05", // Google Yellow
    error: "#EA4335", // Google Red
    success: "#34A853", // Google Green
    background: "#FFFFFF", // White
    surface: "#F8F9FA", // Light Gray
    text: "#202124", // Dark Gray
    textSecondary: "#5F6368", // Medium Gray
    border: "#DADCE0", // Light Border
    disabled: "#E8EAED", // Disabled Gray
    infoBackground: "#E8F0FE", // Light Blue Background
};

// Spacing
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

// Font Sizes
export const FONT_SIZES = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
};

// Font Weights
export const FONT_WEIGHTS = {
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
};

// Border Radius
export const BORDER_RADIUS = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
};

// Shadows
export const SHADOWS = {
    small: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    medium: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
        elevation: 4,
    },
    large: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
};

// Screen Names
export const SCREENS = {
    HOME: "Home",
    SUMMARY: "Summary",
    HISTORY: "History",
    SETTINGS: "Settings",
    QA: "QA",
};

// Tab Icons
export const TAB_ICONS = {
    [SCREENS.HOME]: "home-outline",
    [SCREENS.HISTORY]: "time-outline", // Changed from 'history' to 'time-outline'
    [SCREENS.SETTINGS]: "settings-outline",
};

// YouTube URL Regex
export const YOUTUBE_URL_REGEX =
    /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)\/.+$/;

// Default TTS Settings
export const DEFAULT_TTS_SETTINGS = {
    rate: 1.0,
    pitch: 1.0,
    voice: null,
};

// TTS Rate Options
export const TTS_RATE_OPTIONS = [
    { value: 0.5, label: "0.5x" },
    { value: 0.75, label: "0.75x" },
    { value: 1.0, label: "1.0x" },
    { value: 1.25, label: "1.25x" },
    { value: 1.5, label: "1.5x" },
    { value: 2.0, label: "2.0x" },
    { value: 2.5, label: "2.5x" },
    { value: 3.0, label: "3.0x" },
    { value: 6.0, label: "6.0x" },
    { value: 8.0, label: "8.0x" },
    { value: 10.0, label: "10.0x" },
    { value: 12.0, label: "12.0x" },
    { value: 14.0, label: "14.0x" },
    { value: 16.0, label: "16.0x" },
];

// TTS Pitch Options
export const TTS_PITCH_OPTIONS = [
    { value: 0.5, label: "0.5x" },
    { value: 0.75, label: "0.75x" },
    { value: 1.0, label: "1.0x" },
    { value: 1.25, label: "1.25x" },
    { value: 1.5, label: "1.5x" },
    { value: 2.0, label: "2.0x" },
];
