import * as SecureStore from "expo-secure-store";
import axios from "axios";
import { API_BASE_URL } from "../constants";

// Constants
const BACKEND_URL_STORAGE_KEY = "backend_url";

/**
 * Get the backend URL from secure storage or return the default
 * @returns {Promise<string>} - The backend URL
 */
export const getBaseUrl = async () => {
    try {
        const storedUrl = await SecureStore.getItemAsync(BACKEND_URL_STORAGE_KEY);
        return storedUrl || API_BASE_URL;
    } catch (error) {
        console.error("Error retrieving backend URL:", error);
        return API_BASE_URL;
    }
};

/**
 * Save a custom backend URL
 * @param {string} url - The URL to save
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const saveBaseUrl = async (url) => {
    try {
        if (!url || url === API_BASE_URL) {
            // If the URL is empty or the default, remove any stored URL
            await SecureStore.deleteItemAsync(BACKEND_URL_STORAGE_KEY);
        } else {
            // Ensure URL doesn't have a trailing slash
            const formattedUrl = url.endsWith("/") ? url.slice(0, -1) : url;
            await SecureStore.setItemAsync(BACKEND_URL_STORAGE_KEY, formattedUrl);
        }
        return true;
    } catch (error) {
        console.error("Error saving backend URL:", error);
        return false;
    }
};

/**
 * Reset the backend URL to the default
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const resetBaseUrl = async () => {
    try {
        await SecureStore.deleteItemAsync(BACKEND_URL_STORAGE_KEY);
        return true;
    } catch (error) {
        console.error("Error resetting backend URL:", error);
        return false;
    }
};

/**
 * Validate a URL format
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
export const isValidUrl = (url) => {
    if (!url) return false;
    
    // Check if URL starts with http:// or https://
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return false;
    }
    
    // Use URL constructor to validate URL format
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Test connection to the backend URL
 * @param {string} url - The URL to test
 * @returns {Promise<{isValid: boolean, message: string}>} - Test result
 */
export const testBackendUrl = async (url) => {
    if (!isValidUrl(url)) {
        return {
            isValid: false,
            message: "Invalid URL format. URL must start with http:// or https://",
        };
    }

    try {
        // Ensure URL doesn't have a trailing slash for consistency
        const formattedUrl = url.endsWith("/") ? url.slice(0, -1) : url;
        
        // Try to connect to the health check endpoint
        const response = await axios.get(`${formattedUrl}/`, {
            timeout: 5000, // 5 second timeout
        });
        
        if (response.status === 200) {
            return {
                isValid: true,
                message: "Connection successful!",
            };
        } else {
            return {
                isValid: false,
                message: `Unexpected response: ${response.status}`,
            };
        }
    } catch (error) {
        console.error("Error testing backend URL:", error);
        
        // Provide specific error messages based on the error type
        if (error.code === "ECONNABORTED") {
            return {
                isValid: false,
                message: "Connection timed out. Please check the URL and try again.",
            };
        } else if (error.response) {
            return {
                isValid: false,
                message: `Server responded with error: ${error.response.status}`,
            };
        } else if (error.request) {
            return {
                isValid: false,
                message: "No response received from server. Please check the URL and try again.",
            };
        } else {
            return {
                isValid: false,
                message: "Connection failed. Please check the URL and try again.",
            };
        }
    }
};
