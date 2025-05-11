/**
 * Server Wakeup Service
 * 
 * This service provides functionality to wake up the backend server
 * from its sleep state by sending a lightweight health check request.
 * It implements retry logic with exponential backoff to handle potential
 * connection issues when the server is starting up.
 */

import axios from "axios";
import * as apiConfigService from "./apiConfigService";

// Constants
const MAX_RETRY_ATTEMPTS = 5;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second
const MAX_RETRY_DELAY_MS = 16000; // 16 seconds

/**
 * Wakes up the backend server by sending a health check request
 * with retry logic and exponential backoff
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.showLogs - Whether to show console logs (default: false)
 * @param {Function} options.onStatusChange - Callback for status updates (optional)
 * @returns {Promise<boolean>} - Whether the server was successfully awakened
 */
export const wakeupServer = async (options = {}) => {
    const { showLogs = false, onStatusChange = null } = options;
    
    // Get the backend URL
    let baseUrl;
    try {
        baseUrl = await apiConfigService.getBaseUrl();
    } catch (error) {
        if (showLogs) {
            console.error("Error getting backend URL:", error);
        }
        return false;
    }
    
    // Update status if callback provided
    if (onStatusChange) {
        onStatusChange({ status: "connecting", message: "Connecting to server..." });
    }
    
    let currentAttempt = 0;
    let delay = INITIAL_RETRY_DELAY_MS;
    
    while (currentAttempt < MAX_RETRY_ATTEMPTS) {
        try {
            if (showLogs) {
                console.log(`Attempt ${currentAttempt + 1}/${MAX_RETRY_ATTEMPTS} to wake up server...`);
            }
            
            // Send health check request
            const response = await axios.get(`${baseUrl}/`, {
                timeout: 5000, // 5 second timeout
            });
            
            if (response.status === 200) {
                if (showLogs) {
                    console.log("Server is awake and responding!");
                }
                
                // Update status if callback provided
                if (onStatusChange) {
                    onStatusChange({ status: "connected", message: "Server is awake!" });
                }
                
                return true;
            }
            
            // If we get here, the response was not 200
            if (showLogs) {
                console.warn(`Unexpected response: ${response.status}`);
            }
        } catch (error) {
            if (showLogs) {
                if (error.code === "ECONNABORTED") {
                    console.warn("Connection timed out, retrying...");
                } else if (error.response) {
                    console.warn(`Server error: ${error.response.status}`);
                } else if (error.request) {
                    console.warn("No response received, server might be starting up...");
                } else {
                    console.error("Error connecting to server:", error.message);
                }
            }
        }
        
        // Update status if callback provided
        if (onStatusChange) {
            onStatusChange({ 
                status: "retrying", 
                message: `Retrying connection (${currentAttempt + 1}/${MAX_RETRY_ATTEMPTS})...`,
                attempt: currentAttempt + 1,
                maxAttempts: MAX_RETRY_ATTEMPTS
            });
        }
        
        // Increment attempt counter
        currentAttempt++;
        
        // If we've reached the maximum attempts, break out of the loop
        if (currentAttempt >= MAX_RETRY_ATTEMPTS) {
            break;
        }
        
        // Wait before next attempt with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Increase delay for next attempt (exponential backoff)
        delay = Math.min(delay * 2, MAX_RETRY_DELAY_MS);
    }
    
    // If we get here, all attempts failed
    if (showLogs) {
        console.error(`Failed to wake up server after ${MAX_RETRY_ATTEMPTS} attempts`);
    }
    
    // Update status if callback provided
    if (onStatusChange) {
        onStatusChange({ 
            status: "failed", 
            message: `Could not connect to server after ${MAX_RETRY_ATTEMPTS} attempts` 
        });
    }
    
    return false;
};

export default {
    wakeupServer,
};
