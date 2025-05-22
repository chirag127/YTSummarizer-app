import React from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Switch,
    useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SPACING, FONT_SIZES } from "../../constants";
import { useTheme, THEME_TYPES } from "../../context/ThemeContext";

/**
 * ThemeSection component for selecting app theme
 */
const ThemeSection = () => {
    const { colors, themeSettings, updateThemeSettings, getCurrentThemeType } = useTheme();
    const deviceTheme = useColorScheme();
    const currentThemeType = getCurrentThemeType();

    // Theme options
    const themeOptions = [
        {
            id: THEME_TYPES.LIGHT,
            label: "Light",
            icon: "sunny-outline",
            description: "Bright backgrounds with dark text",
            colors: {
                background: "#FFFFFF",
                surface: "#F8F9FA",
                text: "#202124",
            },
        },
        {
            id: THEME_TYPES.DARK,
            label: "Dark",
            icon: "moon-outline",
            description: "Dark backgrounds with light text",
            colors: {
                background: "#202124",
                surface: "#303134",
                text: "#E8EAED",
            },
        },
        {
            id: THEME_TYPES.AMOLED,
            label: "AMOLED Dark",
            icon: "contrast-outline",
            description: "True black for AMOLED displays",
            colors: {
                background: "#000000",
                surface: "#121212",
                text: "#FFFFFF",
            },
        },
    ];

    // Handle theme option selection
    const handleThemeSelect = (themeType) => {
        updateThemeSettings({
            themeType,
            useDeviceTheme: false,
        });
    };

    // Handle device theme toggle
    const handleDeviceThemeToggle = (value) => {
        updateThemeSettings({
            useDeviceTheme: value,
            // If turning on device theme, update the theme type to match device
            themeType: value ? (deviceTheme === "dark" ? THEME_TYPES.DARK : THEME_TYPES.LIGHT) : themeSettings.themeType,
        });
    };

    return (
        <View style={[styles.settingSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>
                Theme
            </Text>

            <View style={styles.deviceThemeRow}>
                <Text style={[styles.deviceThemeLabel, { color: colors.text }]}>
                    Use Device Theme:
                </Text>
                <Switch
                    value={themeSettings.useDeviceTheme}
                    onValueChange={handleDeviceThemeToggle}
                    trackColor={{
                        false: colors.border,
                        true: colors.primary,
                    }}
                    thumbColor={colors.background}
                />
            </View>

            {themeSettings.useDeviceTheme && (
                <Text style={[styles.deviceThemeInfo, { color: colors.textSecondary }]}>
                    Currently using {deviceTheme === "dark" ? "dark" : "light"} theme based on your device settings
                </Text>
            )}

            {!themeSettings.useDeviceTheme && (
                <View style={styles.themeOptionsContainer}>
                    {themeOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.themeOption,
                                {
                                    borderColor: currentThemeType === option.id ? colors.primary : colors.border,
                                    backgroundColor: currentThemeType === option.id ? `${colors.primary}20` : colors.surface,
                                },
                            ]}
                            onPress={() => handleThemeSelect(option.id)}
                        >
                            <View style={styles.themePreview}>
                                <View
                                    style={[
                                        styles.themePreviewBackground,
                                        { backgroundColor: option.colors.background },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.themePreviewSurface,
                                            { backgroundColor: option.colors.surface },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.themePreviewText,
                                                { color: option.colors.text },
                                            ]}
                                        >
                                            Aa
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.themeInfo}>
                                <View style={styles.themeHeader}>
                                    <Ionicons
                                        name={option.icon}
                                        size={20}
                                        color={currentThemeType === option.id ? colors.primary : colors.text}
                                    />
                                    <Text
                                        style={[
                                            styles.themeLabel,
                                            {
                                                color: currentThemeType === option.id ? colors.primary : colors.text,
                                                fontWeight: currentThemeType === option.id ? "600" : "400",
                                            },
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </View>
                                <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>
                                    {option.description}
                                </Text>
                            </View>

                            {currentThemeType === option.id && (
                                <View style={styles.selectedIndicator}>
                                    <Ionicons
                                        name="checkmark-circle"
                                        size={24}
                                        color={colors.primary}
                                    />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    settingSection: {
        borderRadius: 8,
        padding: SPACING.md,
        marginBottom: SPACING.lg,
    },
    settingTitle: {
        fontSize: FONT_SIZES.lg,
        fontWeight: "600",
        marginBottom: SPACING.md,
    },
    deviceThemeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: SPACING.md,
    },
    deviceThemeLabel: {
        fontSize: FONT_SIZES.md,
    },
    deviceThemeInfo: {
        fontSize: FONT_SIZES.sm,
        marginBottom: SPACING.md,
        fontStyle: "italic",
    },
    themeOptionsContainer: {
        marginTop: SPACING.sm,
    },
    themeOption: {
        flexDirection: "row",
        alignItems: "center",
        padding: SPACING.md,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: SPACING.md,
    },
    themePreview: {
        width: 60,
        height: 60,
        borderRadius: 8,
        overflow: "hidden",
        marginRight: SPACING.md,
    },
    themePreviewBackground: {
        flex: 1,
        padding: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    themePreviewSurface: {
        width: "100%",
        height: "70%",
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    themePreviewText: {
        fontSize: FONT_SIZES.md,
        fontWeight: "bold",
    },
    themeInfo: {
        flex: 1,
    },
    themeHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: SPACING.xs,
    },
    themeLabel: {
        fontSize: FONT_SIZES.md,
        marginLeft: SPACING.xs,
    },
    themeDescription: {
        fontSize: FONT_SIZES.sm,
    },
    selectedIndicator: {
        marginLeft: SPACING.sm,
    },
});

export default ThemeSection;
