import React, { useState, useEffect } from "react";
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as apiKeyService from "../../services/apiKeyService";
import { SPACING, FONT_SIZES, API_KEY_SELECTION_MODES } from "../../constants";
import { useTheme } from "../../context/ThemeContext";
import useThemedStyles from "../../hooks/useThemedStyles";

const ApiKeySection = () => {
    // Get theme colors
    const { colors } = useTheme();

    // Use themed styles (this is a large component, so I'll define the most critical styles)
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
        apiKeySelectionContainer: {
            marginBottom: SPACING.lg,
        },
        apiKeySelectionTitle: {
            fontSize: FONT_SIZES.md,
            fontWeight: "600",
            color: colors.text,
            marginBottom: SPACING.sm,
        },
        apiKeySelectionOptions: {
            flexDirection: "row",
            flexWrap: "wrap",
        },
        apiKeySelectionOption: {
            paddingVertical: SPACING.sm,
            paddingHorizontal: SPACING.md,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            marginRight: SPACING.sm,
            marginBottom: SPACING.sm,
            backgroundColor: colors.background,
        },
        apiKeySelectionOptionSelected: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
        },
        apiKeySelectionOptionText: {
            fontSize: FONT_SIZES.sm,
            color: colors.text,
        },
        apiKeySelectionOptionTextSelected: {
            color: colors.background,
        },
        apiKeyItemContainer: {
            marginBottom: SPACING.lg,
            padding: SPACING.md,
            backgroundColor: colors.background,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
        },
        apiKeyItemHeader: {
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: SPACING.sm,
        },
        apiKeyItemLabelContainer: {
            flexDirection: "row",
            alignItems: "center",
        },
        apiKeyItemLabel: {
            fontSize: FONT_SIZES.md,
            fontWeight: "600",
            color: colors.text,
        },
        activeKeyIndicator: {
            backgroundColor: colors.success,
            paddingHorizontal: SPACING.sm,
            paddingVertical: SPACING.xs,
            borderRadius: 12,
            marginLeft: SPACING.sm,
        },
        activeKeyIndicatorText: {
            fontSize: FONT_SIZES.xs,
            color: colors.background,
            fontWeight: "600",
        },
        setActiveButton: {
            backgroundColor: colors.accent,
            paddingHorizontal: SPACING.sm,
            paddingVertical: SPACING.xs,
            borderRadius: 16,
        },
        setActiveButtonText: {
            fontSize: FONT_SIZES.xs,
            color: colors.background,
            fontWeight: "600",
        },
        apiKeyInputContainer: {
            flexDirection: "row",
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            marginBottom: SPACING.md,
            backgroundColor: colors.surface,
        },
        apiKeyInput: {
            flex: 1,
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.md,
            color: colors.text,
            fontSize: FONT_SIZES.md,
        },
        visibilityButton: {
            alignItems: "center",
            justifyContent: "center",
            width: 50,
            height: 50,
        },
        apiKeyButtonsContainer: {
            flexDirection: "row",
            justifyContent: "space-between",
        },
        apiKeyButton: {
            alignItems: "center",
            justifyContent: "center",
            width: 50,
            height: 50,
            borderRadius: 25,
            marginRight: SPACING.sm,
        },
        saveButton: {
            backgroundColor: colors.primary,
        },
        testButton: {
            backgroundColor: colors.success,
        },
        clearButton: {
            backgroundColor: colors.error,
        },
        newApiKeyContainer: {
            marginBottom: SPACING.lg,
            padding: SPACING.md,
            backgroundColor: colors.background,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
        },
        cancelButton: {
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 20,
        },
        addApiKeyButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.primary,
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.lg,
            borderRadius: 8,
            marginBottom: SPACING.md,
        },
        addApiKeyButtonText: {
            color: colors.background,
            fontSize: FONT_SIZES.md,
            fontWeight: "600",
            marginLeft: SPACING.sm,
        },
        getApiKeyButton: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.accent,
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.lg,
            borderRadius: 8,
        },
        getApiKeyButtonText: {
            color: colors.background,
            fontSize: FONT_SIZES.md,
            fontWeight: "600",
            marginLeft: SPACING.sm,
        },
        getApiKeyLink: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.accent,
            paddingVertical: SPACING.md,
            paddingHorizontal: SPACING.lg,
            borderRadius: 8,
            marginBottom: SPACING.md,
        },
        getApiKeyText: {
            color: colors.background,
            fontSize: FONT_SIZES.md,
            fontWeight: "600",
            marginRight: SPACING.sm,
        },
        apiKeyInfoContainer: {
            flexDirection: "row",
            alignItems: "flex-start",
            backgroundColor: colors.infoBackground,
            padding: SPACING.md,
            borderRadius: 8,
            marginTop: SPACING.sm,
        },
        apiKeyInfoText: {
            flex: 1,
            fontSize: FONT_SIZES.sm,
            color: colors.textSecondary,
            marginLeft: SPACING.sm,
            lineHeight: 20,
        },
    }));

    // API Key state
    const [apiKeys, setApiKeys] = useState([]);
    const [activeKeyIndex, setActiveKeyIndex] = useState(-1);
    const [apiKeySelectionMode, setApiKeySelectionMode] = useState("specific");
    const [isTestingApiKey, setIsTestingApiKey] = useState(false);
    const [apiKeyVisible, setApiKeyVisible] = useState(false);
    const [isAddingNewKey, setIsAddingNewKey] = useState(false);
    const [newApiKey, setNewApiKey] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Load API keys
    useEffect(() => {
        const loadApiKeys = async () => {
            try {
                // Load API keys
                const storedKeys = await apiKeyService.getAllApiKeys();
                setApiKeys(
                    storedKeys.map((key) => ({
                        ...key,
                        // Mask the API key for display (show only last 4 characters)
                        displayKey:
                            key.key.length > 4
                                ? "•".repeat(key.key.length - 4) +
                                  key.key.slice(-4)
                                : key.key,
                    }))
                );

                // Get active key index
                const activeIndex = await apiKeyService.getActiveApiKeyIndex();
                setActiveKeyIndex(activeIndex);

                // Get API key selection mode
                const mode = await apiKeyService.getApiKeySelectionMode();
                setApiKeySelectionMode(mode);
            } catch (error) {
                console.error("Error loading API keys:", error);
                Alert.alert("Error", "Failed to load API keys.");
            }
        };

        loadApiKeys();
    }, []);

    // Handle API key change for a specific index
    const handleApiKeyChange = (text, index) => {
        const updatedKeys = [...apiKeys];
        updatedKeys[index] = {
            ...updatedKeys[index],
            key: text,
            displayKey: text.length > 0 ? text : updatedKeys[index].displayKey,
        };
        setApiKeys(updatedKeys);
    };

    // Handle new API key change
    const handleNewApiKeyChange = (text) => {
        setNewApiKey(text);
    };

    // Add a new API key field
    const handleAddApiKey = () => {
        setIsAddingNewKey(true);
        setNewApiKey("");
    };

    // Cancel adding a new API key
    const handleCancelAddApiKey = () => {
        setIsAddingNewKey(false);
        setNewApiKey("");
    };

    // Save a new API key
    const handleSaveNewApiKey = async () => {
        if (!newApiKey.trim()) {
            Alert.alert("Error", "Please enter a valid API key.");
            return;
        }

        setIsSaving(true);
        try {
            const success = await apiKeyService.saveApiKey(newApiKey.trim());
            if (success) {
                // Refresh the API keys list
                const storedKeys = await apiKeyService.getAllApiKeys();
                setApiKeys(
                    storedKeys.map((key) => ({
                        ...key,
                        displayKey:
                            key.key.length > 4
                                ? "•".repeat(key.key.length - 4) +
                                  key.key.slice(-4)
                                : key.key,
                    }))
                );

                // Get active key index
                const activeIndex = await apiKeyService.getActiveApiKeyIndex();
                setActiveKeyIndex(activeIndex);

                setIsAddingNewKey(false);
                setNewApiKey("");
                Alert.alert("Success", "API key added successfully.");
            } else {
                Alert.alert("Error", "Failed to add API key.");
            }
        } catch (error) {
            console.error("Error adding API key:", error);
            Alert.alert("Error", "Failed to add API key.");
        } finally {
            setIsSaving(false);
        }
    };

    // Save an existing API key
    const handleSaveApiKey = async (index) => {
        const apiKey = apiKeys[index].key;

        if (!apiKey.trim()) {
            Alert.alert("Error", "Please enter a valid API key.");
            return;
        }

        setIsSaving(true);
        try {
            const success = await apiKeyService.saveApiKey(
                apiKey.trim(),
                index
            );
            if (success) {
                // Refresh the API keys list
                const storedKeys = await apiKeyService.getAllApiKeys();
                setApiKeys(
                    storedKeys.map((key) => ({
                        ...key,
                        displayKey:
                            key.key.length > 4
                                ? "•".repeat(key.key.length - 4) +
                                  key.key.slice(-4)
                                : key.key,
                    }))
                );
                Alert.alert("Success", "API key updated successfully.");
            } else {
                Alert.alert("Error", "Failed to update API key.");
            }
        } catch (error) {
            console.error("Error updating API key:", error);
            Alert.alert("Error", "Failed to update API key.");
        } finally {
            setIsSaving(false);
        }
    };

    // Test an API key
    const handleTestApiKey = async (index) => {
        const apiKey = apiKeys[index].key;

        if (!apiKey.trim()) {
            Alert.alert("Error", "Please enter a valid API key.");
            return;
        }

        setIsTestingApiKey(true);
        try {
            const result = await apiKeyService.testApiKey(apiKey.trim());
            if (result.isValid) {
                Alert.alert("Success", "API key is valid!");
            } else {
                Alert.alert("Error", result.message);
            }
        } catch (error) {
            console.error("Error testing API key:", error);
            Alert.alert("Error", "Failed to test API key.");
        } finally {
            setIsTestingApiKey(false);
        }
    };

    // Test a new API key
    const handleTestNewApiKey = async () => {
        if (!newApiKey.trim()) {
            Alert.alert("Error", "Please enter a valid API key.");
            return;
        }

        setIsTestingApiKey(true);
        try {
            const result = await apiKeyService.testApiKey(newApiKey.trim());
            if (result.isValid) {
                Alert.alert("Success", "API key is valid!");
            } else {
                Alert.alert("Error", result.message);
            }
        } catch (error) {
            console.error("Error testing API key:", error);
            Alert.alert("Error", "Failed to test API key.");
        } finally {
            setIsTestingApiKey(false);
        }
    };

    // Clear an API key
    const handleClearApiKey = async (index) => {
        Alert.alert(
            "Clear API Key",
            "Are you sure you want to remove this API key?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        setIsSaving(true);
                        try {
                            const success = await apiKeyService.clearApiKey(
                                index
                            );
                            if (success) {
                                // Refresh the API keys list
                                const storedKeys =
                                    await apiKeyService.getAllApiKeys();
                                setApiKeys(
                                    storedKeys.map((key) => ({
                                        ...key,
                                        displayKey:
                                            key.key.length > 4
                                                ? "•".repeat(
                                                      key.key.length - 4
                                                  ) + key.key.slice(-4)
                                                : key.key,
                                    }))
                                );

                                // Get active key index
                                const activeIndex =
                                    await apiKeyService.getActiveApiKeyIndex();
                                setActiveKeyIndex(activeIndex);

                                Alert.alert(
                                    "Success",
                                    "API key removed successfully."
                                );
                            } else {
                                Alert.alert(
                                    "Error",
                                    "Failed to remove API key."
                                );
                            }
                        } catch (error) {
                            console.error("Error clearing API key:", error);
                            Alert.alert("Error", "Failed to remove API key.");
                        } finally {
                            setIsSaving(false);
                        }
                    },
                },
            ]
        );
    };

    // Set an API key as active
    const handleSetActiveApiKey = async (index) => {
        try {
            const success = await apiKeyService.setActiveApiKeyIndex(index);
            if (success) {
                setActiveKeyIndex(index);
                Alert.alert("Success", "Active API key updated.");
            } else {
                Alert.alert("Error", "Failed to update active API key.");
            }
        } catch (error) {
            console.error("Error setting active API key:", error);
            Alert.alert("Error", "Failed to update active API key.");
        }
    };

    // Set API key selection mode
    const handleSetApiKeySelectionMode = async (mode) => {
        try {
            const success = await apiKeyService.setApiKeySelectionMode(mode);
            if (success) {
                setApiKeySelectionMode(mode);
            } else {
                Alert.alert(
                    "Error",
                    "Failed to update API key selection mode."
                );
            }
        } catch (error) {
            console.error("Error setting API key selection mode:", error);
            Alert.alert("Error", "Failed to update API key selection mode.");
        }
    };

    // Open Google AI Studio website
    const handleOpenGoogleAIStudio = () => {
        Linking.openURL("https://makersuite.google.com/app/apikey");
    };

    return (
        <View style={styles.settingSection}>
            <Text style={styles.settingTitle}>Gemini API Keys</Text>
            <Text style={styles.settingDescription}>
                Enter your own Google Gemini API keys to use for generating
                summaries. You can add multiple keys and choose how they are
                used.
            </Text>

            {/* API Key Selection Mode */}
            <View style={styles.apiKeySelectionContainer}>
                <Text style={styles.apiKeySelectionTitle}>
                    API Key Selection Mode:
                </Text>
                <View style={styles.apiKeySelectionOptions}>
                    {API_KEY_SELECTION_MODES.map((mode) => (
                        <TouchableOpacity
                            key={mode.id}
                            style={[
                                styles.apiKeySelectionOption,
                                apiKeySelectionMode === mode.id &&
                                    styles.apiKeySelectionOptionSelected,
                            ]}
                            onPress={() =>
                                handleSetApiKeySelectionMode(mode.id)
                            }
                        >
                            <Text
                                style={[
                                    styles.apiKeySelectionOptionText,
                                    apiKeySelectionMode === mode.id &&
                                        styles.apiKeySelectionOptionTextSelected,
                                ]}
                            >
                                {mode.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Existing API Keys */}
            {apiKeys.map((apiKeyItem, index) => (
                <View key={index} style={styles.apiKeyItemContainer}>
                    <View style={styles.apiKeyItemHeader}>
                        <View style={styles.apiKeyItemLabelContainer}>
                            <Text style={styles.apiKeyItemLabel}>
                                {apiKeyItem.label}
                            </Text>
                            {apiKeySelectionMode === "specific" &&
                                index === activeKeyIndex && (
                                    <View style={styles.activeKeyIndicator}>
                                        <Text
                                            style={
                                                styles.activeKeyIndicatorText
                                            }
                                        >
                                            Active
                                        </Text>
                                    </View>
                                )}
                        </View>
                        {apiKeySelectionMode === "specific" &&
                            index !== activeKeyIndex && (
                                <TouchableOpacity
                                    style={styles.setActiveButton}
                                    onPress={() => handleSetActiveApiKey(index)}
                                >
                                    <Text style={styles.setActiveButtonText}>
                                        Set as Active
                                    </Text>
                                </TouchableOpacity>
                            )}
                    </View>

                    <View style={styles.apiKeyInputContainer}>
                        <TextInput
                            style={styles.apiKeyInput}
                            value={apiKeyItem.key}
                            onChangeText={(text) =>
                                handleApiKeyChange(text, index)
                            }
                            placeholder="Enter your Gemini API key"
                            placeholderTextColor={colors.textSecondary}
                            secureTextEntry={!apiKeyVisible}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.visibilityButton}
                            onPress={() => setApiKeyVisible(!apiKeyVisible)}
                        >
                            <Ionicons
                                name={apiKeyVisible ? "eye-off" : "eye"}
                                size={24}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.apiKeyButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.apiKeyButton, styles.saveButton]}
                            onPress={() => handleSaveApiKey(index)}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator
                                    size="small"
                                    color={colors.background}
                                />
                            ) : (
                                <Ionicons
                                    name="save"
                                    size={22}
                                    color={colors.background}
                                />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.apiKeyButton, styles.testButton]}
                            onPress={() => handleTestApiKey(index)}
                            disabled={isTestingApiKey}
                        >
                            {isTestingApiKey ? (
                                <ActivityIndicator
                                    size="small"
                                    color={colors.background}
                                />
                            ) : (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={22}
                                    color={colors.background}
                                />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.apiKeyButton, styles.clearButton]}
                            onPress={() => handleClearApiKey(index)}
                            disabled={isSaving}
                        >
                            <Ionicons
                                name="trash"
                                size={22}
                                color={colors.background}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            ))}

            {/* Add New API Key */}
            {isAddingNewKey ? (
                <View style={styles.newApiKeyContainer}>
                    <View style={styles.apiKeyItemHeader}>
                        <Text style={styles.apiKeyItemLabel}>New API Key</Text>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancelAddApiKey}
                        >
                            <Ionicons
                                name="close"
                                size={22}
                                color={colors.error}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.apiKeyInputContainer}>
                        <TextInput
                            style={styles.apiKeyInput}
                            value={newApiKey}
                            onChangeText={handleNewApiKeyChange}
                            placeholder="Enter your Gemini API key"
                            placeholderTextColor={colors.textSecondary}
                            secureTextEntry={!apiKeyVisible}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        <TouchableOpacity
                            style={styles.visibilityButton}
                            onPress={() => setApiKeyVisible(!apiKeyVisible)}
                        >
                            <Ionicons
                                name={apiKeyVisible ? "eye-off" : "eye"}
                                size={24}
                                color={colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.apiKeyButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.apiKeyButton, styles.saveButton]}
                            onPress={handleSaveNewApiKey}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator
                                    size="small"
                                    color={colors.background}
                                />
                            ) : (
                                <Ionicons
                                    name="save"
                                    size={22}
                                    color={colors.background}
                                />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.apiKeyButton, styles.testButton]}
                            onPress={handleTestNewApiKey}
                            disabled={isTestingApiKey}
                        >
                            {isTestingApiKey ? (
                                <ActivityIndicator
                                    size="small"
                                    color={colors.background}
                                />
                            ) : (
                                <Ionicons
                                    name="checkmark-circle"
                                    size={22}
                                    color={colors.background}
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.addApiKeyButton}
                    onPress={handleAddApiKey}
                >
                    <Ionicons
                        name="add-circle"
                        size={20}
                        color={colors.primary}
                    />
                    <Text style={styles.addApiKeyButtonText}>
                        Add Another API Key
                    </Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity
                style={styles.getApiKeyLink}
                onPress={handleOpenGoogleAIStudio}
            >
                <Text style={styles.getApiKeyText}>
                    Get a Gemini API key from Google AI Studio
                </Text>
                <Ionicons
                    name="open-outline"
                    size={16}
                    color={colors.primary}
                />
            </TouchableOpacity>

            <View style={styles.apiKeyInfoContainer}>
                <Ionicons
                    name="information-circle"
                    size={20}
                    color={colors.textSecondary}
                />
                <Text style={styles.apiKeyInfoText}>
                    Using your own API keys will count against your personal
                    quota. Your keys are stored securely on your device and are
                    never shared. Adding multiple keys can help distribute usage
                    and avoid rate limits.
                </Text>
            </View>
        </View>
    );
};

export default ApiKeySection;
