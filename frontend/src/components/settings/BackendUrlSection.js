import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as apiConfigService from "../../services/apiConfigService";
import { SPACING, FONT_SIZES, API_BASE_URL } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

/**
 * BackendUrlSection component for configuring the backend API URL
 */
const BackendUrlSection = () => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles
    const styles = useThemedStyles((colors) => ({
        settingSection: {
            marginBottom: SPACING.xl,
            backgroundColor: colors.surface,
            borderRadius: 8,
            padding: SPACING.md,
        },
        settingTitle: {
            fontSize: FONT_SIZES.lg,
            fontWeight: "600",
            color: colors.text,
            marginBottom: SPACING.xs,
        },
        settingDescription: {
            fontSize: FONT_SIZES.sm,
            color: colors.textSecondary,
            marginBottom: SPACING.md,
        },
        loader: {
            marginVertical: SPACING.md,
        },
        urlInputContainer: {
            flexDirection: "row",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            marginBottom: SPACING.md,
            backgroundColor: colors.background,
        },
        urlInput: {
            flex: 1,
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.md,
            color: colors.text,
            fontSize: FONT_SIZES.md,
        },
        urlInputError: {
            borderColor: colors.error,
        },
        errorText: {
            color: colors.error,
            fontSize: FONT_SIZES.sm,
            marginBottom: SPACING.md,
        },
        urlButtonsContainer: {
            flexDirection: "row",
            marginBottom: SPACING.md,
        },
        urlButton: {
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: SPACING.md,
        },
        saveButton: {
            backgroundColor: colors.primary,
        },
        testButton: {
            backgroundColor: colors.success,
        },
        resetButton: {
            backgroundColor: colors.accent,
        },
        disabledButton: {
            opacity: 0.5,
        },
        urlInfoContainer: {
            flexDirection: "row",
            backgroundColor: colors.infoBackground,
            padding: SPACING.md,
            borderRadius: 8,
            alignItems: "flex-start",
        },
        urlInfoText: {
            flex: 1,
            fontSize: FONT_SIZES.sm,
            color: colors.textSecondary,
            marginLeft: SPACING.sm,
        },
    }));

    // State variables
    const [backendUrl, setBackendUrl] = useState("");
    const [originalUrl, setOriginalUrl] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [urlVisible, setUrlVisible] = useState(true);
    const [validationError, setValidationError] = useState("");

    // Load the backend URL
    useEffect(() => {
        const loadBackendUrl = async () => {
            try {
                const url = await apiConfigService.getBaseUrl();
                setBackendUrl(url);
                setOriginalUrl(url);
            } catch (error) {
                console.error("Error loading backend URL:", error);
                Alert.alert("Error", "Failed to load backend URL.");
            } finally {
                setIsLoading(false);
            }
        };

        loadBackendUrl();
    }, []);

    // Handle URL change
    const handleUrlChange = (text) => {
        setBackendUrl(text);
        setIsEditing(text !== originalUrl);

        // Validate URL format
        if (text && !apiConfigService.isValidUrl(text)) {
            setValidationError(
                "Invalid URL format. URL must start with http:// or https://"
            );
        } else {
            setValidationError("");
        }
    };

    // Save the backend URL
    const handleSaveUrl = async () => {
        if (validationError) {
            Alert.alert("Error", validationError);
            return;
        }

        setIsSaving(true);
        try {
            const success = await apiConfigService.saveBaseUrl(
                backendUrl.trim()
            );
            if (success) {
                setOriginalUrl(backendUrl.trim());
                setIsEditing(false);
                Alert.alert("Success", "Backend URL saved successfully.");
            } else {
                Alert.alert("Error", "Failed to save backend URL.");
            }
        } catch (error) {
            console.error("Error saving backend URL:", error);
            Alert.alert("Error", "Failed to save backend URL.");
        } finally {
            setIsSaving(false);
        }
    };

    // Test the backend URL
    const handleTestUrl = async () => {
        if (validationError) {
            Alert.alert("Error", validationError);
            return;
        }

        setIsTesting(true);
        try {
            const result = await apiConfigService.testBackendUrl(
                backendUrl.trim()
            );
            if (result.isValid) {
                Alert.alert("Success", "Connection to backend successful!");
            } else {
                Alert.alert("Error", result.message);
            }
        } catch (error) {
            console.error("Error testing backend URL:", error);
            Alert.alert("Error", "Failed to test backend URL.");
        } finally {
            setIsTesting(false);
        }
    };

    // Reset to default URL
    const handleResetUrl = () => {
        Alert.alert(
            "Reset to Default",
            "Are you sure you want to reset to the default backend URL?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Reset",
                    onPress: async () => {
                        setIsSaving(true);
                        try {
                            const success =
                                await apiConfigService.resetBaseUrl();
                            if (success) {
                                setBackendUrl(API_BASE_URL);
                                setOriginalUrl(API_BASE_URL);
                                setIsEditing(false);
                                Alert.alert(
                                    "Success",
                                    "Backend URL reset to default."
                                );
                            } else {
                                Alert.alert(
                                    "Error",
                                    "Failed to reset backend URL."
                                );
                            }
                        } catch (error) {
                            console.error(
                                "Error resetting backend URL:",
                                error
                            );
                            Alert.alert(
                                "Error",
                                "Failed to reset backend URL."
                            );
                        } finally {
                            setIsSaving(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.settingSection}>
            <Text style={styles.settingTitle}>Backend URL Configuration</Text>
            <Text style={styles.settingDescription}>
                Configure the URL for the backend API server. This should only
                be changed if you are using a custom backend deployment.
            </Text>

            {isLoading ? (
                <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    style={styles.loader}
                />
            ) : (
                <>
                    <View style={styles.urlInputContainer}>
                        <TextInput
                            style={[
                                styles.urlInput,
                                validationError ? styles.urlInputError : null,
                            ]}
                            value={backendUrl}
                            onChangeText={handleUrlChange}
                            placeholder="Enter backend URL"
                            placeholderTextColor={colors.textSecondary}
                            autoCapitalize="none"
                            autoCorrect={false}
                            keyboardType="url"
                        />
                    </View>

                    {validationError ? (
                        <Text style={styles.errorText}>{validationError}</Text>
                    ) : null}

                    <View style={styles.urlButtonsContainer}>
                        <TouchableOpacity
                            style={[
                                styles.urlButton,
                                styles.saveButton,
                                (!isEditing || validationError) &&
                                    styles.disabledButton,
                            ]}
                            onPress={handleSaveUrl}
                            disabled={!isEditing || validationError || isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator
                                    size="small"
                                    color={colors.background}
                                />
                            ) : (
                                <Ionicons
                                    name="save-outline"
                                    size={20}
                                    color={colors.background}
                                />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.urlButton,
                                styles.testButton,
                                validationError && styles.disabledButton,
                            ]}
                            onPress={handleTestUrl}
                            disabled={validationError || isTesting}
                        >
                            {isTesting ? (
                                <ActivityIndicator
                                    size="small"
                                    color={colors.background}
                                />
                            ) : (
                                <Ionicons
                                    name="checkmark-outline"
                                    size={20}
                                    color={colors.background}
                                />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.urlButton, styles.resetButton]}
                            onPress={handleResetUrl}
                            disabled={isSaving}
                        >
                            <Ionicons
                                name="refresh-outline"
                                size={20}
                                color={colors.background}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.urlInfoContainer}>
                        <Ionicons
                            name="information-circle"
                            size={20}
                            color={colors.textSecondary}
                        />
                        <Text style={styles.urlInfoText}>
                            The backend URL is used for all API requests.
                            Changing this will affect all app functionality.
                            Make sure the URL is correct and the server is
                            running before saving.
                        </Text>
                    </View>
                </>
            )}
        </View>
    );
};

export default BackendUrlSection;
