import AsyncStorage from "@react-native-async-storage/async-storage";
import apiActions from "./apiActions";
import NetInfo from "@react-native-community/netinfo";

// Storage key
const SYNC_LOG_KEY = "@syncLog";

// Get sync log
export const getSyncLog = async () => {
    try {
        const data = await AsyncStorage.getItem(SYNC_LOG_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Error getting sync log:", error);
        return [];
    }
};

// Add to sync log
export const addToSyncLog = async (action, videoId, summaryId = null) => {
    try {
        const syncLog = await getSyncLog();

        // Create new log entry
        const logEntry = {
            action,
            videoId,
            summaryId,
            timestamp: Date.now(),
        };

        // Add to log
        const updatedLog = [...syncLog, logEntry];
        await AsyncStorage.setItem(SYNC_LOG_KEY, JSON.stringify(updatedLog));

        return logEntry;
    } catch (error) {
        console.error("Error adding to sync log:", error);
        throw error;
    }
};

// Remove from sync log
export const removeFromSyncLog = async (index) => {
    try {
        const syncLog = await getSyncLog();

        if (index < 0 || index >= syncLog.length) {
            return false;
        }

        const updatedLog = [
            ...syncLog.slice(0, index),
            ...syncLog.slice(index + 1),
        ];

        await AsyncStorage.setItem(SYNC_LOG_KEY, JSON.stringify(updatedLog));
        return true;
    } catch (error) {
        console.error(
            `Error removing item at index ${index} from sync log:`,
            error
        );
        return false;
    }
};

// Process sync log
export const processSyncLog = async () => {
    // Check network status
    const netInfo = await NetInfo.fetch();
    const isNetworkAvailable =
        netInfo.isConnected && netInfo.isInternetReachable;

    if (!isNetworkAvailable) {
        console.log("Network not available, skipping sync log processing");
        return false;
    }

    try {
        const syncLog = await getSyncLog();

        if (syncLog.length === 0) {
            return true;
        }

        const results = [];

        // Process each log entry
        for (let i = 0; i < syncLog.length; i++) {
            const entry = syncLog[i];

            try {
                switch (entry.action) {
                    case "star":
                        await apiActions.toggleStarSummary(
                            entry.summaryId,
                            true,
                            addToSyncLog
                        );
                        results.push({ success: true, index: i });
                        break;

                    case "unstar":
                        await apiActions.toggleStarSummary(
                            entry.summaryId,
                            false,
                            addToSyncLog
                        );
                        results.push({ success: true, index: i });
                        break;

                    case "delete":
                        await apiActions.deleteSummary(
                            entry.summaryId,
                            addToSyncLog
                        );
                        results.push({ success: true, index: i });
                        break;

                    default:
                        console.warn(
                            `Unknown action in sync log: ${entry.action}`
                        );
                        results.push({
                            success: false,
                            index: i,
                            error: "Unknown action",
                        });
                }
            } catch (error) {
                console.error(
                    `Error processing sync log entry at index ${i}:`,
                    error
                );
                results.push({
                    success: false,
                    index: i,
                    error: error.message,
                });
            }
        }

        // Remove successful entries from the log (in reverse order to avoid index issues)
        const successfulIndices = results
            .filter((r) => r.success)
            .map((r) => r.index)
            .sort((a, b) => b - a); // Sort in descending order

        for (const index of successfulIndices) {
            await removeFromSyncLog(index);
        }

        return results.every((r) => r.success);
    } catch (error) {
        console.error("Error processing sync log:", error);
        return false;
    }
};

// Clear sync log
export const clearSyncLog = async () => {
    try {
        await AsyncStorage.removeItem(SYNC_LOG_KEY);
        return true;
    } catch (error) {
        console.error("Error clearing sync log:", error);
        return false;
    }
};

export default {
    getSyncLog,
    addToSyncLog,
    removeFromSyncLog,
    processSyncLog,
    clearSyncLog,
};
