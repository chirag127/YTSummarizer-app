import * as SecureStore from "expo-secure-store";
import axios from "axios";

// Constants
const API_KEYS_STORAGE_KEY = "user_gemini_api_keys";
const ACTIVE_API_KEY_INDEX_KEY = "active_gemini_api_key_index";
const API_KEY_SELECTION_MODE_KEY = "gemini_api_key_selection_mode";
const TEST_API_ENDPOINT =
    "https://generativelanguage.googleapis.com/v1beta/models";

// For backward compatibility
const LEGACY_API_KEY_STORAGE_KEY = "user_gemini_api_key";

/**
 * Get all stored API keys
 * @returns {Promise<Array<{key: string, label: string}>>} - Array of stored API keys
 */
export const getAllApiKeys = async () => {
    try {
        // Check for legacy key first (for backward compatibility)
        const legacyKey = await SecureStore.getItemAsync(
            LEGACY_API_KEY_STORAGE_KEY
        );

        if (legacyKey) {
            // Migrate the legacy key to the new format
            const keys = [{ key: legacyKey, label: "API Key 1" }];
            await SecureStore.setItemAsync(
                API_KEYS_STORAGE_KEY,
                JSON.stringify(keys)
            );
            await SecureStore.setItemAsync(ACTIVE_API_KEY_INDEX_KEY, "0");
            await SecureStore.deleteItemAsync(LEGACY_API_KEY_STORAGE_KEY);
            return keys;
        }

        // Get keys from new storage
        const keysJson = await SecureStore.getItemAsync(API_KEYS_STORAGE_KEY);
        if (!keysJson) return [];

        return JSON.parse(keysJson);
    } catch (error) {
        console.error("Error retrieving API keys:", error);
        return [];
    }
};

/**
 * Save an API key at a specific index
 * @param {string} apiKey - The API key to save
 * @param {number} index - The index to save the key at (if undefined, adds as new key)
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const saveApiKey = async (apiKey, index = undefined) => {
    try {
        const keys = await getAllApiKeys();

        if (index !== undefined && index >= 0 && index < keys.length) {
            // Update existing key
            keys[index].key = apiKey;
        } else {
            // Add new key
            const newIndex = keys.length + 1;
            keys.push({ key: apiKey, label: `API Key ${newIndex}` });

            // If this is the first key, set it as active
            if (keys.length === 1) {
                await SecureStore.setItemAsync(ACTIVE_API_KEY_INDEX_KEY, "0");
            }
        }

        await SecureStore.setItemAsync(
            API_KEYS_STORAGE_KEY,
            JSON.stringify(keys)
        );
        return true;
    } catch (error) {
        console.error("Error saving API key:", error);
        return false;
    }
};

/**
 * Update the label for an API key
 * @param {number} index - The index of the key to update
 * @param {string} label - The new label
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const updateApiKeyLabel = async (index, label) => {
    try {
        const keys = await getAllApiKeys();

        if (index >= 0 && index < keys.length) {
            keys[index].label = label;
            await SecureStore.setItemAsync(
                API_KEYS_STORAGE_KEY,
                JSON.stringify(keys)
            );
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error updating API key label:", error);
        return false;
    }
};

/**
 * Get the active API key index
 * @returns {Promise<number>} - The index of the active API key or -1 if none
 */
export const getActiveApiKeyIndex = async () => {
    try {
        const indexStr = await SecureStore.getItemAsync(
            ACTIVE_API_KEY_INDEX_KEY
        );
        return indexStr ? parseInt(indexStr, 10) : -1;
    } catch (error) {
        console.error("Error retrieving active API key index:", error);
        return -1;
    }
};

/**
 * Set the active API key index
 * @param {number} index - The index to set as active
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const setActiveApiKeyIndex = async (index) => {
    try {
        const keys = await getAllApiKeys();

        if (index >= 0 && index < keys.length) {
            await SecureStore.setItemAsync(
                ACTIVE_API_KEY_INDEX_KEY,
                index.toString()
            );
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error setting active API key index:", error);
        return false;
    }
};

/**
 * Get the API key selection mode
 * @returns {Promise<string>} - The selection mode ('specific' or 'random')
 */
export const getApiKeySelectionMode = async () => {
    try {
        const mode = await SecureStore.getItemAsync(API_KEY_SELECTION_MODE_KEY);
        return mode || "specific"; // Default to 'specific'
    } catch (error) {
        console.error("Error retrieving API key selection mode:", error);
        return "specific";
    }
};

/**
 * Set the API key selection mode
 * @param {string} mode - The selection mode ('specific' or 'random')
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const setApiKeySelectionMode = async (mode) => {
    try {
        if (mode === "specific" || mode === "random") {
            await SecureStore.setItemAsync(API_KEY_SELECTION_MODE_KEY, mode);
            return true;
        }
        return false;
    } catch (error) {
        console.error("Error setting API key selection mode:", error);
        return false;
    }
};

/**
 * Get the currently active API key based on selection mode
 * @returns {Promise<string|null>} - The active API key or null if none
 */
export const getApiKey = async () => {
    try {
        const keys = await getAllApiKeys();
        if (keys.length === 0) return null;

        const mode = await getApiKeySelectionMode();

        if (mode === "random") {
            // Randomly select an API key
            const randomIndex = Math.floor(Math.random() * keys.length);
            return keys[randomIndex].key;
        } else {
            // Use the specific active key
            const activeIndex = await getActiveApiKeyIndex();
            if (activeIndex >= 0 && activeIndex < keys.length) {
                return keys[activeIndex].key;
            } else if (keys.length > 0) {
                // Fallback to the first key if no active key is set
                return keys[0].key;
            }
        }

        return null;
    } catch (error) {
        console.error("Error retrieving API key:", error);
        return null;
    }
};

/**
 * Check if any user-provided API keys exist
 * @returns {Promise<boolean>} - Whether any user-provided API keys exist
 */
export const hasApiKey = async () => {
    const keys = await getAllApiKeys();
    return keys.length > 0;
};

/**
 * Clear a specific API key
 * @param {number} index - The index of the key to clear
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const clearApiKey = async (index) => {
    try {
        const keys = await getAllApiKeys();

        if (index >= 0 && index < keys.length) {
            // Remove the key at the specified index
            keys.splice(index, 1);

            // Update storage
            await SecureStore.setItemAsync(
                API_KEYS_STORAGE_KEY,
                JSON.stringify(keys)
            );

            // Update active index if needed
            const activeIndex = await getActiveApiKeyIndex();
            if (activeIndex === index) {
                // If we removed the active key, set the first key as active (if any)
                if (keys.length > 0) {
                    await setActiveApiKeyIndex(0);
                } else {
                    await SecureStore.deleteItemAsync(ACTIVE_API_KEY_INDEX_KEY);
                }
            } else if (activeIndex > index) {
                // If we removed a key before the active key, decrement the active index
                await setActiveApiKeyIndex(activeIndex - 1);
            }

            return true;
        }

        return false;
    } catch (error) {
        console.error("Error clearing API key:", error);
        return false;
    }
};

/**
 * Clear all API keys
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const clearAllApiKeys = async () => {
    try {
        await SecureStore.deleteItemAsync(API_KEYS_STORAGE_KEY);
        await SecureStore.deleteItemAsync(ACTIVE_API_KEY_INDEX_KEY);
        return true;
    } catch (error) {
        console.error("Error clearing all API keys:", error);
        return false;
    }
};

/**
 * Test if an API key is valid by making a simple request to the Gemini API
 * @param {string} apiKey - The API key to test
 * @returns {Promise<{isValid: boolean, message: string}>} - Result of the test
 */
export const testApiKey = async (apiKey) => {
    try {
        // Make a simple request to the Gemini API to check if the key is valid
        // Using a simple models list endpoint which should work with any valid API key
        await axios.get(`${TEST_API_ENDPOINT}?key=${apiKey}`);

        // If we get here, the key is valid
        return { isValid: true, message: "API key is valid!" };
    } catch (error) {
        console.error("Error testing API key:", error);

        // Check for specific error codes
        if (error.response) {
            const { status } = error.response;

            if (status === 400) {
                return { isValid: false, message: "Invalid API key format." };
            } else if (status === 401 || status === 403) {
                return {
                    isValid: false,
                    message: "Invalid API key or insufficient permissions.",
                };
            } else if (status === 429) {
                return { isValid: false, message: "API key quota exceeded." };
            }
        }

        return {
            isValid: false,
            message:
                "Failed to validate API key. Please check your internet connection.",
        };
    }
};

export default {
    getAllApiKeys,
    saveApiKey,
    updateApiKeyLabel,
    getActiveApiKeyIndex,
    setActiveApiKeyIndex,
    getApiKeySelectionMode,
    setApiKeySelectionMode,
    getApiKey,
    hasApiKey,
    clearApiKey,
    clearAllApiKeys,
    testApiKey,
};
