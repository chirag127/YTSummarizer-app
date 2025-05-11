// apiActions.js - Shared API actions to break circular dependencies
import axios from "axios";
import NetInfo from "@react-native-community/netinfo";
import * as storageService from "./storageService";
import * as apiConfigService from "./apiConfigService";
import { extractVideoId } from "../utils";
import { API_BASE_URL } from "../constants";

// Create axios instance with dynamic base URL
// The base URL will be updated before each request
const api = axios.create({
    headers: {
        "Content-Type": "application/json",
    },
});

// Add request interceptor to set baseURL dynamically
api.interceptors.request.use(
    async (config) => {
        try {
            // Set the baseURL dynamically from apiConfigService
            const baseUrl = await apiConfigService.getBaseUrl();
            config.baseURL = baseUrl;
        } catch (error) {
            console.error("Error in request interceptor:", error);
            // Set default baseURL if there's an error
            config.baseURL = API_BASE_URL;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Toggle star status for a summary
 * @param {string} id - Summary ID
 * @param {boolean} isStarred - New star status
 * @param {Function} addToSyncLog - Function to add to sync log
 * @returns {Promise<Object>} Updated summary
 */
export const toggleStarSummary = async (id, isStarred, addToSyncLog) => {
    // Check network status
    const netInfo = await NetInfo.fetch();
    const isNetworkAvailable =
        netInfo.isConnected && netInfo.isInternetReachable;

    try {
        // Get the summary details first
        const summaryResult = await storageService.getSummaryBySummaryId(id);

        // Update local storage first if we have the summary
        if (summaryResult) {
            const { videoData } = summaryResult;
            await storageService.updateSummary(videoData.videoId, id, {
                is_starred: isStarred,
            });
        }

        if (isNetworkAvailable) {
            // Try to update via API
            const response = await api.patch(`/summaries/${id}/star`, {
                is_starred: isStarred,
            });

            return response.data;
        } else {
            // Offline mode - add to sync log
            if (summaryResult && addToSyncLog) {
                await addToSyncLog(
                    isStarred ? "star" : "unstar",
                    summaryResult.videoData.videoId,
                    id
                );

                // Return the locally updated summary
                return {
                    id: id,
                    is_starred: isStarred,
                    video_url: summaryResult.videoData.url,
                    video_title: summaryResult.videoData.title,
                    video_thumbnail_url: summaryResult.videoData.thumbnailUrl,
                    thumbnailLocalUri:
                        summaryResult.videoData.thumbnailLocalUri,
                    summary_text: summaryResult.summaryData.text,
                    summary_type: summaryResult.summaryData.type,
                    summary_length: summaryResult.summaryData.length,
                    created_at: summaryResult.summaryData.generatedAt,
                    updated_at: new Date().toISOString(),
                };
            } else {
                // We don't have the summary locally, return a mock
                return {
                    id: id,
                    is_starred: isStarred,
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
            }
        }
    } catch (error) {
        console.error(
            `Error toggling star status for summary with ID ${id}:`,
            error
        );

        // If there's a network error, add to sync log
        if (error.message === "Network Error") {
            try {
                const summaryResult =
                    await storageService.getSummaryBySummaryId(id);

                if (summaryResult && addToSyncLog) {
                    // Update local storage
                    await storageService.updateSummary(
                        summaryResult.videoData.videoId,
                        id,
                        { is_starred: isStarred }
                    );

                    // Add to sync log
                    await addToSyncLog(
                        isStarred ? "star" : "unstar",
                        summaryResult.videoData.videoId,
                        id
                    );

                    // Return the locally updated summary
                    return {
                        id: id,
                        is_starred: isStarred,
                        video_url: summaryResult.videoData.url,
                        video_title: summaryResult.videoData.title,
                        video_thumbnail_url:
                            summaryResult.videoData.thumbnailUrl,
                        thumbnailLocalUri:
                            summaryResult.videoData.thumbnailLocalUri,
                        summary_text: summaryResult.summaryData.text,
                        summary_type: summaryResult.summaryData.type,
                        summary_length: summaryResult.summaryData.length,
                        created_at: summaryResult.summaryData.generatedAt,
                        updated_at: new Date().toISOString(),
                    };
                }
            } catch (innerError) {
                console.error(
                    "Error handling offline star update:",
                    innerError
                );
            }

            // Return a mock updated summary as fallback
            return {
                id: id,
                is_starred: isStarred,
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
        }

        throw error;
    }
};

/**
 * Delete a summary
 * @param {string} id - Summary ID
 * @param {Function} addToSyncLog - Function to add to sync log
 * @returns {Promise<Object>} Success response
 */
export const deleteSummary = async (id, addToSyncLog) => {
    // Check network status
    const netInfo = await NetInfo.fetch();
    const isNetworkAvailable =
        netInfo.isConnected && netInfo.isInternetReachable;

    try {
        // Get the summary details first
        const summaryResult = await storageService.getSummaryBySummaryId(id);

        // Delete from local storage first if we have the summary
        if (summaryResult) {
            const { videoData } = summaryResult;
            await storageService.deleteSummary(videoData.videoId, id);
        }

        if (isNetworkAvailable) {
            // Try to delete via API
            const response = await api.delete(`/summaries/${id}`);
            return response.data;
        } else {
            // Offline mode - add to sync log
            if (summaryResult && addToSyncLog) {
                await addToSyncLog(
                    "delete",
                    summaryResult.videoData.videoId,
                    id
                );
            }

            // Return a success response
            return { success: true, message: "Summary deleted (offline mode)" };
        }
    } catch (error) {
        console.error(`Error deleting summary with ID ${id}:`, error);

        // If there's a network error, add to sync log
        if (error.message === "Network Error") {
            try {
                const summaryResult =
                    await storageService.getSummaryBySummaryId(id);

                if (summaryResult && addToSyncLog) {
                    // Delete from local storage
                    await storageService.deleteSummary(
                        summaryResult.videoData.videoId,
                        id
                    );

                    // Add to sync log
                    await addToSyncLog(
                        "delete",
                        summaryResult.videoData.videoId,
                        id
                    );
                }
            } catch (innerError) {
                console.error("Error handling offline deletion:", innerError);
            }

            // Return a success response
            return { success: true, message: "Summary deleted (offline mode)" };
        }

        throw error;
    }
};

export default {
    toggleStarSummary,
    deleteSummary,
};
