import * as BackgroundTask from "expo-background-task";
import * as TaskManager from "expo-task-manager";
import NetInfo from "@react-native-community/netinfo";
import { processSyncLog } from "../services/syncService";
import { processQueue } from "../services/api";

// Task names
export const SYNC_TASK = "BACKGROUND_SYNC_TASK";
export const QUEUE_PROCESSING_TASK = "BACKGROUND_QUEUE_PROCESSING_TASK";

// Define the background sync task
TaskManager.defineTask(SYNC_TASK, async () => {
    try {
        // Check network status
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected || !netInfo.isInternetReachable) {
            console.log("Network not available, skipping background sync");
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        // Process sync log
        const syncResult = await processSyncLog();

        if (syncResult) {
            console.log("Background sync completed successfully");
            return BackgroundTask.BackgroundTaskResult.Success;
        } else {
            console.log("Background sync completed with no changes");
            return BackgroundTask.BackgroundTaskResult.Success;
        }
    } catch (error) {
        console.error("Error in background sync task:", error);
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});

// Define the queue processing task
TaskManager.defineTask(QUEUE_PROCESSING_TASK, async () => {
    try {
        // Check network status
        const netInfo = await NetInfo.fetch();
        if (!netInfo.isConnected || !netInfo.isInternetReachable) {
            console.log("Network not available, skipping queue processing");
            return BackgroundTask.BackgroundTaskResult.Success;
        }

        // Process queue
        const queueResult = await processQueue();

        if (queueResult && queueResult.processed > 0) {
            console.log(
                `Processed ${queueResult.processed} queue items in background`
            );
            return BackgroundTask.BackgroundTaskResult.Success;
        } else {
            console.log("Queue processing completed with no changes");
            return BackgroundTask.BackgroundTaskResult.Success;
        }
    } catch (error) {
        console.error("Error in queue processing task:", error);
        return BackgroundTask.BackgroundTaskResult.Failed;
    }
});

// Register background tasks
export const registerBackgroundTasks = async () => {
    try {
        // Check if background tasks are available
        const status = await BackgroundTask.getStatusAsync();

        if (status === BackgroundTask.BackgroundTaskStatus.Available) {
            // Register sync task
            await BackgroundTask.registerTaskAsync(SYNC_TASK, {
                minimumInterval: 15, // 15 minutes
            });
            console.log("Registered background sync task");

            // Register queue processing task
            await BackgroundTask.registerTaskAsync(QUEUE_PROCESSING_TASK, {
                minimumInterval: 15, // 15 minutes
            });
            console.log("Registered background queue processing task");

            console.log("Background tasks registered");
            return true;
        } else {
            console.log("Background tasks not available on this device");
            return false;
        }
    } catch (error) {
        console.error("Error registering background tasks:", error);
        return false;
    }
};

// Unregister background tasks
export const unregisterBackgroundTasks = async () => {
    try {
        // Check if tasks are registered
        const syncRegistered = await TaskManager.isTaskRegisteredAsync(
            SYNC_TASK
        );
        const queueRegistered = await TaskManager.isTaskRegisteredAsync(
            QUEUE_PROCESSING_TASK
        );

        // Unregister if registered
        if (syncRegistered) {
            await BackgroundTask.unregisterTaskAsync(SYNC_TASK);
        }

        if (queueRegistered) {
            await BackgroundTask.unregisterTaskAsync(QUEUE_PROCESSING_TASK);
        }

        return true;
    } catch (error) {
        console.error("Error unregistering background tasks:", error);
        return false;
    }
};

export default {
    SYNC_TASK,
    QUEUE_PROCESSING_TASK,
    registerBackgroundTasks,
    unregisterBackgroundTasks,
};
