import * as SecureStore from "expo-secure-store";
import axios from "axios";

// Constants
const API_KEY_STORAGE_KEY = "user_gemini_api_key";
const TEST_API_ENDPOINT =
    "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Save the user's Gemini API key securely
 * @param {string} apiKey - The API key to save
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const saveApiKey = async (apiKey) => {
    try {
        await SecureStore.setItemAsync(API_KEY_STORAGE_KEY, apiKey);
        return true;
    } catch (error) {
        console.error("Error saving API key:", error);
        return false;
    }
};

/**
 * Get the user's stored Gemini API key
 * @returns {Promise<string|null>} - The stored API key or null if not found
 */
export const getApiKey = async () => {
    try {
        const apiKey = await SecureStore.getItemAsync(API_KEY_STORAGE_KEY);
        return apiKey;
    } catch (error) {
        console.error("Error retrieving API key:", error);
        return null;
    }
};

/**
 * Check if a user-provided API key exists
 * @returns {Promise<boolean>} - Whether a user-provided API key exists
 */
export const hasApiKey = async () => {
    const apiKey = await getApiKey();
    return !!apiKey;
};

/**
 * Clear the stored API key
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const clearApiKey = async () => {
    try {
        await SecureStore.deleteItemAsync(API_KEY_STORAGE_KEY);
        return true;
    } catch (error) {
        console.error("Error clearing API key:", error);
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
    saveApiKey,
    getApiKey,
    hasApiKey,
    clearApiKey,
    testApiKey,
};
