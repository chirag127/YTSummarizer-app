import axios from "axios";

// Base URL for API calls - change this to your backend URL
// You can use your local IP address instead of localhost for testing on physical devices
const API_BASE_URL = "http://localhost:8000";

// Create axios instance with base URL
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 10000, // 10 seconds timeout
});

// Add response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Log the error for debugging
        console.log("API Error:", error.message);

        // Continue throwing the error for individual handlers
        return Promise.reject(error);
    }
);

// API functions
// URL validation removed as per requirement
export const validateYouTubeUrl = async (url) => {
    // Return a mock successful validation response
    return { valid: true, has_transcript: true };
};

export const generateSummary = async (url, summaryType, summaryLength) => {
    try {
        const response = await api.post("/generate-summary", {
            url,
            summary_type: summaryType,
            summary_length: summaryLength,
        });
        return response.data;
    } catch (error) {
        console.error("Error generating summary:", error);
        // If there's a network error, try to continue with a fallback
        if (error.message === "Network Error") {
            console.log("Network error detected, using fallback method");
            // Create a mock summary response as fallback
            return {
                id: "fallback-" + Date.now(),
                video_url: url,
                video_title: "Video Title (Fallback)",
                video_thumbnail_url:
                    "https://via.placeholder.com/480x360?text=Network+Error",
                summary_text:
                    "Unable to generate summary due to network error. Please try again later.",
                summary_type: summaryType,
                summary_length: summaryLength,
                created_at: new Date().toISOString(),
            };
        } else {
            throw error;
        }
    }
};

export const getAllSummaries = async () => {
    try {
        const response = await api.get("/summaries");
        return response.data;
    } catch (error) {
        console.error("Error fetching summaries:", error);
        throw error;
    }
};

export const getSummaryById = async (id) => {
    try {
        const response = await api.get(`/summaries/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching summary with ID ${id}:`, error);
        throw error;
    }
};

export const updateSummary = async (id, summaryType, summaryLength) => {
    try {
        const response = await api.put(`/summaries/${id}`, {
            summary_type: summaryType,
            summary_length: summaryLength,
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating summary with ID ${id}:`, error);
        throw error;
    }
};

export const deleteSummary = async (id) => {
    try {
        const response = await api.delete(`/summaries/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting summary with ID ${id}:`, error);
        throw error;
    }
};

export default {
    validateYouTubeUrl,
    generateSummary,
    getAllSummaries,
    getSummaryById,
    updateSummary,
    deleteSummary,
};
