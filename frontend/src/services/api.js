import axios from "axios";
import { getApiKey } from "./apiKeyService";
import NetInfo from "@react-native-community/netinfo";
import * as storageService from "./storageService";
import * as queueService from "./queueService";
import * as syncService from "./syncService";
import * as cacheService from "./cacheService";
import { extractVideoId } from "../utils";
import apiActions from "./apiActions";
import { API_BASE_URL } from "../constants";

// Base URL for API calls - change this to your backend URL
// const API_BASE_URL = "https://ytsummarizer2-react-native-expo-app.onrender.com";
// const API_BASE_URL = "http://192.168.31.232:8000";

// Create axios instance with base URL
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add request interceptor to include user API key if available
api.interceptors.request.use(
    async (config) => {
        try {
            const userApiKey = await getApiKey();
            if (userApiKey) {
                config.headers["X-User-API-Key"] = userApiKey;
            }
        } catch (error) {
            console.error("Error retrieving API key:", error);
            // Continue with the request even if we couldn't get the API key
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

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

export const generateSummary = async (
    url,
    summaryType,
    summaryLength,
    signal
) => {
    // Check network status
    const netInfo = await NetInfo.fetch();
    const isNetworkAvailable =
        netInfo.isConnected && netInfo.isInternetReachable;

    // If offline, add to queue
    if (!isNetworkAvailable) {
        const queueItem = await queueService.addToQueue({
            url,
            type: summaryType,
            length: summaryLength,
        });

        // Return a placeholder summary
        return {
            id: queueItem.requestId,
            video_url: url,
            video_title: "Pending Summary (Offline)",
            video_thumbnail_url: null,
            summary_text:
                "This summary will be generated when you're back online.",
            summary_type: summaryType,
            summary_length: summaryLength,
            created_at: new Date().toISOString(),
            is_queued: true,
            queue_status: "pending",
        };
    }

    try {
        const response = await api.post(
            "/generate-summary",
            {
                url,
                summary_type: summaryType,
                summary_length: summaryLength,
            },
            { signal }
        ); // Pass the abort signal to axios

        const summary = response.data;

        // Cache the summary locally
        await storageService.saveSummary(summary);

        // Cache the thumbnail if available
        if (summary.video_thumbnail_url) {
            const videoId = extractVideoId(summary.video_url);
            const cachedImageUri = await cacheService.cacheImage(
                summary.video_thumbnail_url,
                videoId
            );

            if (cachedImageUri) {
                // Update the summary with the local thumbnail URI
                await storageService.updateSummary(videoId, summary.id, {
                    thumbnailLocalUri: cachedImageUri,
                });
            }
        }

        return summary;
    } catch (error) {
        console.error("Error generating summary:", error);

        // Check if the request was aborted
        if (error.name === "AbortError" || error.name === "CanceledError") {
            console.log("Request was cancelled by user");
            throw error; // Re-throw to be handled by the caller
        }

        // If there's a network error, try to continue with a fallback
        if (error.message === "Network Error") {
            console.log("Network error detected, using fallback method");

            // Add to queue for later processing
            const queueItem = await queueService.addToQueue({
                url,
                type: summaryType,
                length: summaryLength,
            });

            // Create a mock summary response as fallback
            return {
                id: queueItem.requestId,
                video_url: url,
                video_title: "Pending Summary (Network Error)",
                video_thumbnail_url: null,
                summary_text:
                    "Unable to generate summary due to network error. The request has been queued and will be processed when the connection is restored.",
                summary_type: summaryType,
                summary_length: summaryLength,
                created_at: new Date().toISOString(),
                is_queued: true,
                queue_status: "pending",
            };
        } else {
            throw error;
        }
    }
};

export const getAllSummaries = async (page = 1, limit = 100) => {
    // Check network status
    const netInfo = await NetInfo.fetch();
    const isNetworkAvailable =
        netInfo.isConnected && netInfo.isInternetReachable;

    try {
        if (isNetworkAvailable) {
            // Try to fetch from API first
            const response = await api.get("/summaries", {
                params: { page, limit },
            });

            // Cache the summaries locally
            for (const summary of response.data.summaries) {
                await storageService.saveSummary(summary);

                // Cache thumbnails
                if (summary.video_thumbnail_url) {
                    const videoId = extractVideoId(summary.video_url);
                    await cacheService.cacheImage(
                        summary.video_thumbnail_url,
                        videoId
                    );
                }
            }

            return response.data;
        } else {
            // Offline mode - use local storage
            const localSummaries = await storageService.getAllSummaries();

            // Get queue items
            const queue = await queueService.getQueue();

            // Combine summaries and queue items
            const combinedResults = [
                ...localSummaries,
                ...queue.map((item) => ({
                    id: item.requestId,
                    video_url: item.url,
                    video_title: "Pending Summary (Offline)",
                    video_thumbnail_url: null,
                    summary_text:
                        "This summary will be generated when you're back online.",
                    summary_type: item.type,
                    summary_length: item.length,
                    created_at: new Date(item.requestedTimestamp).toISOString(),
                    is_queued: true,
                    queue_status: item.status,
                    failureReason: item.failureReason,
                })),
            ];

            // Sort by creation date (newest first)
            combinedResults.sort(
                (a, b) => new Date(b.created_at) - new Date(a.created_at)
            );

            // Apply pagination
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedResults = combinedResults.slice(
                startIndex,
                endIndex
            );

            return {
                summaries: paginatedResults,
                pagination: {
                    page,
                    limit,
                    total_count: combinedResults.length,
                    total_pages: Math.ceil(combinedResults.length / limit),
                    has_next: endIndex < combinedResults.length,
                    has_prev: page > 1,
                },
            };
        }
    } catch (error) {
        console.error("Error fetching summaries:", error);

        // Fallback to local storage
        const localSummaries = await storageService.getAllSummaries();

        // Get queue items
        const queue = await queueService.getQueue();

        // Combine summaries and queue items
        const combinedResults = [
            ...localSummaries,
            ...queue.map((item) => ({
                id: item.requestId,
                video_url: item.url,
                video_title: "Pending Summary (Offline)",
                video_thumbnail_url: null,
                summary_text:
                    "This summary will be generated when you're back online.",
                summary_type: item.type,
                summary_length: item.length,
                created_at: new Date(item.requestedTimestamp).toISOString(),
                is_queued: true,
                queue_status: item.status,
                failureReason: item.failureReason,
            })),
        ];

        // Sort by creation date (newest first)
        combinedResults.sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedResults = combinedResults.slice(startIndex, endIndex);

        return {
            summaries: paginatedResults,
            pagination: {
                page,
                limit,
                total_count: combinedResults.length,
                total_pages: Math.ceil(combinedResults.length / limit),
                has_next: endIndex < combinedResults.length,
                has_prev: page > 1,
            },
        };
    }
};

export const getSummaryById = async (id) => {
    // Check network status
    const netInfo = await NetInfo.fetch();
    const isNetworkAvailable =
        netInfo.isConnected && netInfo.isInternetReachable;

    try {
        if (isNetworkAvailable) {
            // Try to fetch from API first
            const response = await api.get(`/summaries/${id}`);

            // Cache the summary locally
            await storageService.saveSummary(response.data);

            // Cache the thumbnail if available
            if (response.data.video_thumbnail_url) {
                const videoId = extractVideoId(response.data.video_url);
                const cachedImageUri = await cacheService.cacheImage(
                    response.data.video_thumbnail_url,
                    videoId
                );

                if (cachedImageUri) {
                    // Update the summary with the local thumbnail URI
                    await storageService.updateSummary(
                        videoId,
                        response.data.id,
                        { thumbnailLocalUri: cachedImageUri }
                    );
                }
            }

            return response.data;
        } else {
            // Offline mode - check local storage
            const localSummaries = await storageService.getAllSummaries();
            const summary = localSummaries.find((s) => s.id === id);

            if (summary) {
                return summary;
            }

            // Check if it's a queued item
            const queue = await queueService.getQueue();
            const queueItem = queue.find((item) => item.requestId === id);

            if (queueItem) {
                return {
                    id: queueItem.requestId,
                    video_url: queueItem.url,
                    video_title: "Pending Summary (Offline)",
                    video_thumbnail_url: null,
                    summary_text:
                        "This summary will be generated when you're back online.",
                    summary_type: queueItem.type,
                    summary_length: queueItem.length,
                    created_at: new Date(
                        queueItem.requestedTimestamp
                    ).toISOString(),
                    is_queued: true,
                    queue_status: queueItem.status,
                    failureReason: queueItem.failureReason,
                };
            }

            throw new Error("Summary not found in local storage");
        }
    } catch (error) {
        console.error(`Error fetching summary with ID ${id}:`, error);

        // Check local storage as fallback
        const localSummaries = await storageService.getAllSummaries();
        const summary = localSummaries.find((s) => s.id === id);

        if (summary) {
            return summary;
        }

        // Check if it's a queued item
        const queue = await queueService.getQueue();
        const queueItem = queue.find((item) => item.requestId === id);

        if (queueItem) {
            return {
                id: queueItem.requestId,
                video_url: queueItem.url,
                video_title: "Pending Summary (Offline)",
                video_thumbnail_url: null,
                summary_text:
                    "This summary will be generated when you're back online.",
                summary_type: queueItem.type,
                summary_length: queueItem.length,
                created_at: new Date(
                    queueItem.requestedTimestamp
                ).toISOString(),
                is_queued: true,
                queue_status: queueItem.status,
                failureReason: queueItem.failureReason,
            };
        }

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

export const regenerateSummary = async (id) => {
    // Check network status
    const netInfo = await NetInfo.fetch();
    const isNetworkAvailable =
        netInfo.isConnected && netInfo.isInternetReachable;

    try {
        if (isNetworkAvailable) {
            // Try to regenerate via API first
            const response = await api.post(`/summaries/${id}/regenerate`);

            // Cache the regenerated summary locally
            await storageService.saveSummary(response.data);

            return response.data;
        } else {
            // Offline mode - add to queue
            const summary = await getSummaryById(id);

            const queueItem = await queueService.addToQueue({
                url: summary.video_url,
                type: summary.summary_type,
                length: summary.summary_length,
                isRegeneration: true,
            });

            // Return a placeholder summary
            return {
                id: queueItem.requestId,
                video_url: summary.video_url,
                video_title: `${summary.video_title} (Regeneration Queued)`,
                video_thumbnail_url: summary.video_thumbnail_url,
                summary_text:
                    "This summary regeneration will be processed when you're back online.",
                summary_type: summary.summary_type,
                summary_length: summary.summary_length,
                created_at: new Date().toISOString(),
                is_queued: true,
                queue_status: "pending",
            };
        }
    } catch (error) {
        console.error("Error regenerating summary:", error);

        // If there's a network error, try to continue with a fallback
        if (error.message === "Network Error") {
            try {
                const summary = await getSummaryById(id);

                const queueItem = await queueService.addToQueue({
                    url: summary.video_url,
                    type: summary.summary_type,
                    length: summary.summary_length,
                    isRegeneration: true,
                });

                return {
                    id: queueItem.requestId,
                    video_url: summary.video_url,
                    video_title: `${summary.video_title} (Regeneration Queued)`,
                    video_thumbnail_url: summary.video_thumbnail_url,
                    summary_text:
                        "This summary regeneration will be processed when you're back online.",
                    summary_type: summary.summary_type,
                    summary_length: summary.summary_length,
                    created_at: new Date().toISOString(),
                    is_queued: true,
                    queue_status: "pending",
                };
            } catch (innerError) {
                console.error(
                    "Error creating queued regeneration summary:",
                    innerError
                );
                throw error;
            }
        }

        throw error;
    }
};

export const updateSummary = async (id, summaryType, summaryLength) => {
    // Check network status
    const netInfo = await NetInfo.fetch();
    const isNetworkAvailable =
        netInfo.isConnected && netInfo.isInternetReachable;

    try {
        if (isNetworkAvailable) {
            // Try to update via API first
            const response = await api.put(`/summaries/${id}`, {
                summary_type: summaryType,
                summary_length: summaryLength,
            });

            // Cache the updated summary locally
            await storageService.saveSummary(response.data);

            return response.data;
        } else {
            // Offline mode - add to queue
            const summary = await getSummaryById(id);

            const queueItem = await queueService.addToQueue({
                url: summary.video_url,
                type: summaryType,
                length: summaryLength,
            });

            return {
                id: queueItem.requestId,
                video_url: summary.video_url,
                video_title: `${summary.video_title} (Update Queued)`,
                video_thumbnail_url: summary.video_thumbnail_url,
                summary_text:
                    "This summary update will be generated when you're back online.",
                summary_type: summaryType,
                summary_length: summaryLength,
                created_at: new Date().toISOString(),
                is_queued: true,
                queue_status: "pending",
            };
        }
    } catch (error) {
        console.error(`Error updating summary with ID ${id}:`, error);

        // If there's a network error, add to queue
        if (error.message === "Network Error") {
            try {
                const summary = await getSummaryById(id);

                const queueItem = await queueService.addToQueue({
                    url: summary.video_url,
                    type: summaryType,
                    length: summaryLength,
                });

                return {
                    id: queueItem.requestId,
                    video_url: summary.video_url,
                    video_title: `${summary.video_title} (Update Queued)`,
                    video_thumbnail_url: summary.video_thumbnail_url,
                    summary_text:
                        "This summary update will be generated when you're back online.",
                    summary_type: summaryType,
                    summary_length: summaryLength,
                    created_at: new Date().toISOString(),
                    is_queued: true,
                    queue_status: "pending",
                };
            } catch (innerError) {
                console.error(
                    "Error creating queued update summary:",
                    innerError
                );

                // Return a mock updated summary as last resort
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
            }
        }

        throw error;
    }
};

export const toggleStarSummary = async (id, isStarred) => {
    // Use the shared implementation from apiActions
    return apiActions.toggleStarSummary(
        id,
        isStarred,
        syncService.addToSyncLog
    );
};

export const deleteSummary = async (id) => {
    // Use the shared implementation from apiActions
    return apiActions.deleteSummary(id, syncService.addToSyncLog);
};

// Get all summaries for a specific video URL
export const getVideoSummaries = async (videoUrl) => {
    // Check network status
    const netInfo = await NetInfo.fetch();
    const isNetworkAvailable =
        netInfo.isConnected && netInfo.isInternetReachable;

    try {
        if (isNetworkAvailable) {
            // Try to fetch from API first
            const response = await api.get("/video-summaries", {
                params: { video_url: videoUrl },
            });

            // Cache the summaries locally
            for (const summary of response.data.summaries) {
                await storageService.saveSummary(summary);

                // Cache thumbnails
                if (summary.video_thumbnail_url) {
                    const videoId = extractVideoId(summary.video_url);
                    await cacheService.cacheImage(
                        summary.video_thumbnail_url,
                        videoId
                    );
                }
            }

            return response.data;
        } else {
            // Offline mode - use local storage
            const videoId = extractVideoId(videoUrl);
            const summary = await storageService.getSummary(videoId);

            if (summary) {
                // Convert to API response format
                const summaries = summary.summaries.map((s) => ({
                    id: s.summaryId,
                    video_id: summary.videoId,
                    video_url: summary.url,
                    video_title: summary.title,
                    video_thumbnail_url: summary.thumbnailUrl,
                    summary_text: s.text,
                    summary_type: s.type,
                    summary_length: s.length,
                    created_at: s.generatedAt,
                    is_starred: s.is_starred || false,
                    thumbnailLocalUri: summary.thumbnailLocalUri,
                }));

                return {
                    video_url: videoUrl,
                    summaries,
                    count: summaries.length,
                };
            }

            return {
                video_url: videoUrl,
                summaries: [],
                count: 0,
            };
        }
    } catch (error) {
        console.error(
            `Error fetching summaries for video URL ${videoUrl}:`,
            error
        );

        // Fallback to local storage
        const videoId = extractVideoId(videoUrl);
        const summary = await storageService.getSummary(videoId);

        if (summary) {
            // Convert to API response format
            const summaries = summary.summaries.map((s) => ({
                id: s.summaryId,
                video_id: summary.videoId,
                video_url: summary.url,
                video_title: summary.title,
                video_thumbnail_url: summary.thumbnailUrl,
                summary_text: s.text,
                summary_type: s.type,
                summary_length: s.length,
                created_at: s.generatedAt,
                is_starred: s.is_starred || false,
                thumbnailLocalUri: summary.thumbnailLocalUri,
            }));

            return {
                video_url: videoUrl,
                summaries,
                count: summaries.length,
            };
        }

        // If there's a network error, return empty data
        return {
            video_url: videoUrl,
            summaries: [],
            count: 0,
        };
    }
};

// Process the offline queue
export const processQueue = async () => {
    // Check network status
    const netInfo = await NetInfo.fetch();
    const isNetworkAvailable =
        netInfo.isConnected && netInfo.isInternetReachable;

    if (!isNetworkAvailable) {
        console.log("Network not available, skipping queue processing");
        return { processed: 0, failed: 0 };
    }

    try {
        const queue = await queueService.getQueue();

        if (queue.length === 0) {
            return { processed: 0, failed: 0 };
        }

        let processed = 0;
        let failed = 0;

        // Process each queue item
        for (const item of queue) {
            // Skip items that are not pending
            if (item.status !== "pending") {
                continue;
            }

            try {
                // Update status to processing
                await queueService.updateQueueItemStatus(
                    item.requestId,
                    "processing"
                );

                // Generate summary
                const response = await api.post("/generate-summary", {
                    url: item.url,
                    summary_type: item.type,
                    summary_length: item.length,
                });

                const summary = response.data;

                // Cache the summary locally
                await storageService.saveSummary(summary);

                // Cache the thumbnail if available
                if (summary.video_thumbnail_url) {
                    const videoId = extractVideoId(summary.video_url);
                    const cachedImageUri = await cacheService.cacheImage(
                        summary.video_thumbnail_url,
                        videoId
                    );

                    if (cachedImageUri) {
                        // Update the summary with the local thumbnail URI
                        await storageService.updateSummary(
                            videoId,
                            summary.id,
                            { thumbnailLocalUri: cachedImageUri }
                        );
                    }
                }

                // Remove from queue
                await queueService.removeFromQueue(item.requestId);

                processed++;
            } catch (error) {
                console.error(
                    `Error processing queue item ${item.requestId}:`,
                    error
                );

                // Update status to failed
                await queueService.updateQueueItemStatus(
                    item.requestId,
                    "failed",
                    error.message
                );

                failed++;
            }
        }

        return { processed, failed };
    } catch (error) {
        console.error("Error processing queue:", error);
        return { processed: 0, failed: 0, error: error.message };
    }
};

// Video Q&A API functions
export const getVideoQAHistory = async (videoId, forceTranscript = false) => {
    // Check network status
    const netInfo = await NetInfo.fetch();
    const isNetworkAvailable =
        netInfo.isConnected && netInfo.isInternetReachable;

    try {
        if (isNetworkAvailable) {
            // Try to fetch from API first
            const response = await api.get(`/api/v1/videos/${videoId}/qa`, {
                params: { force_transcript: forceTranscript },
            });

            // Force transcript to be available for testing
            if (response.data && !response.data.has_transcript) {
                console.log(
                    "Forcing transcript availability for video ID:",
                    videoId
                );
                response.data.has_transcript = true;
            }

            return response.data;
        } else {
            // Offline mode - return empty history with offline flag
            return {
                video_id: videoId,
                video_title: "Offline Mode",
                video_thumbnail_url: null,
                history: [],
                has_transcript: true, // Force transcript to be available
                is_offline: true,
            };
        }
    } catch (error) {
        console.error(
            `Error fetching Q&A history for video ID ${videoId}:`,
            error
        );

        // Return empty history with error flag
        return {
            video_id: videoId,
            video_title: "Error",
            video_thumbnail_url: null,
            history: [],
            has_transcript: true, // Force transcript to be available
            error: error.message,
        };
    }
};

export const askVideoQuestion = async (videoId, question, history = []) => {
    // Check network status
    const netInfo = await NetInfo.fetch();
    const isNetworkAvailable =
        netInfo.isConnected && netInfo.isInternetReachable;

    if (!isNetworkAvailable) {
        // Offline mode - return error response
        return {
            video_id: videoId,
            video_title: "Offline Mode",
            video_thumbnail_url: null,
            history: [
                ...history,
                {
                    role: "user",
                    content: question,
                    timestamp: new Date().toISOString(),
                },
                {
                    role: "model",
                    content:
                        "I'm sorry, but you need to be online to ask questions about videos. Please try again when you have an internet connection.",
                    timestamp: new Date().toISOString(),
                },
            ],
            has_transcript: false,
            is_offline: true,
        };
    }

    try {
        // Send question to API
        const response = await api.post(`/api/v1/videos/${videoId}/qa`, {
            question,
            history: history.length > 0 ? history : undefined,
        });

        return response.data;
    } catch (error) {
        console.error(`Error asking question for video ID ${videoId}:`, error);

        // Return error response
        return {
            video_id: videoId,
            video_title: "Error",
            video_thumbnail_url: null,
            history: [
                ...history,
                {
                    role: "user",
                    content: question,
                    timestamp: new Date().toISOString(),
                },
                {
                    role: "model",
                    content: `I'm sorry, but there was an error processing your question: ${error.message}. Please try again later.`,
                    timestamp: new Date().toISOString(),
                },
            ],
            has_transcript: false,
            error: error.message,
        };
    }
};

export default {
    validateYouTubeUrl,
    generateSummary,
    getAllSummaries,
    getSummaryById,
    updateSummary,
    regenerateSummary,
    toggleStarSummary,
    deleteSummary,
    getVideoSummaries,
    processQueue,
    getVideoQAHistory,
    askVideoQuestion,
};
