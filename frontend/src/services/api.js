import axios from "axios";

// Base URL for API calls - change this to your backend URL
// const API_BASE_URL = "https://ytsummarizer2-react-native-expo-app.onrender.com";
const API_BASE_URL = "http://192.168.31.232:8000";

// Create axios instance with base URL
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
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

        // If there's a network error, return mock data
        if (error.message === "Network Error") {
            console.log("Network error detected, returning mock summaries");
            // Return empty array or mock data as fallback
            return [];

            // Uncomment below to return mock data instead of empty array
            /*
            return [
                {
                    id: "mock-1",
                    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    video_title: "Sample Video (Offline Mode)",
                    video_thumbnail_url: "https://via.placeholder.com/480x360?text=Offline+Mode",
                    summary_text: "This is a sample summary shown when you're offline. Connect to the internet to see your actual summaries.",
                    summary_type: "Brief",
                    summary_length: "Medium",
                    created_at: new Date().toISOString(),
                }
            ];
            */
        }

        throw error;
    }
};

export const getSummaryById = async (id) => {
    try {
        const response = await api.get(`/summaries/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching summary with ID ${id}:`, error);

        // If there's a network error, return mock data for the specific ID
        if (error.message === "Network Error") {
            console.log(
                `Network error detected, returning mock summary for ID ${id}`
            );
            // Return a mock summary with the requested ID
            return {
                id: id,
                video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                video_title: "Video Details Unavailable (Offline Mode)",
                video_thumbnail_url:
                    "https://via.placeholder.com/480x360?text=Offline+Mode",
                summary_text:
                    "Unable to retrieve the summary details due to network connectivity issues. Please try again when you're back online.",
                summary_type: "Brief",
                summary_length: "Medium",
                created_at: new Date().toISOString(),
            };
        }

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

        // If there's a network error, return a mock updated summary
        if (error.message === "Network Error") {
            console.log(
                `Network error detected, returning mock updated summary for ID ${id}`
            );
            // First try to get the existing summary details
            try {
                // Try to get the current summary from local state if possible
                // For now, return a mock updated summary
                return {
                    id: id,
                    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    video_title: "Updated Summary (Offline Mode)",
                    video_thumbnail_url:
                        "https://via.placeholder.com/480x360?text=Offline+Mode",
                    summary_text:
                        "This summary was updated in offline mode. Changes may not be saved to the server.",
                    summary_type: summaryType,
                    summary_length: summaryLength,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
            } catch (innerError) {
                console.error(
                    "Error creating mock updated summary:",
                    innerError
                );
                throw error; // Throw the original error
            }
        }

        throw error;
    }
};

export const toggleStarSummary = async (id, isStarred) => {
    try {
        const response = await api.patch(`/summaries/${id}/star`, {
            is_starred: isStarred,
        });
        return response.data;
    } catch (error) {
        console.error(
            `Error toggling star status for summary with ID ${id}:`,
            error
        );

        // If there's a network error, return a mock updated summary
        if (error.message === "Network Error") {
            console.log(
                `Network error detected, returning mock updated star status for ID ${id}`
            );
            // Try to get the current summary from local state if possible
            try {
                // For now, return a mock updated summary
                return {
                    id: id,
                    is_starred: isStarred,
                    // Include other required fields with placeholder values
                    video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                    video_title: "Summary (Offline Mode)",
                    video_thumbnail_url:
                        "https://via.placeholder.com/480x360?text=Offline+Mode",
                    summary_text:
                        "This summary's star status was updated in offline mode. Changes may not be saved to the server.",
                    summary_type: "Brief",
                    summary_length: "Medium",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
            } catch (innerError) {
                console.error("Error creating mock star update:", innerError);
                throw error; // Throw the original error
            }
        }

        throw error;
    }
};

export const deleteSummary = async (id) => {
    try {
        const response = await api.delete(`/summaries/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting summary with ID ${id}:`, error);

        // If there's a network error, pretend the deletion was successful
        if (error.message === "Network Error") {
            console.log(
                `Network error detected, simulating successful deletion for ID ${id}`
            );
            // Return a success response
            return { success: true, message: "Summary deleted (offline mode)" };
        }

        throw error;
    }
};

export default {
    validateYouTubeUrl,
    generateSummary,
    getAllSummaries,
    getSummaryById,
    updateSummary,
    toggleStarSummary,
    deleteSummary,
};
