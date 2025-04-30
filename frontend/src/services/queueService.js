import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key
const QUEUE_KEY = '@offlineQueue';

// Get the queue
export const getQueue = async () => {
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting queue:', error);
    return [];
  }
};

// Add to queue
export const addToQueue = async (request) => {
  try {
    const queue = await getQueue();
    
    // Check if a similar request already exists
    const existingIndex = queue.findIndex(
      item => item.url === request.url && 
              item.type === request.type && 
              item.length === request.length &&
              item.status === 'pending'
    );
    
    if (existingIndex !== -1) {
      // Return the existing request
      return queue[existingIndex];
    }
    
    // Create new queue item
    const queueItem = {
      requestId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      url: request.url,
      type: request.type,
      length: request.length,
      requestedTimestamp: Date.now(),
      status: 'pending',
      failureReason: null,
    };
    
    // Add to queue
    const updatedQueue = [...queue, queueItem];
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
    
    return queueItem;
  } catch (error) {
    console.error('Error adding to queue:', error);
    throw error;
  }
};

// Remove from queue
export const removeFromQueue = async (requestId) => {
  try {
    const queue = await getQueue();
    const updatedQueue = queue.filter(item => item.requestId !== requestId);
    
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
    return true;
  } catch (error) {
    console.error(`Error removing item ${requestId} from queue:`, error);
    return false;
  }
};

// Update queue item status
export const updateQueueItemStatus = async (requestId, status, failureReason = null) => {
  try {
    const queue = await getQueue();
    const updatedQueue = queue.map(item => {
      if (item.requestId === requestId) {
        return {
          ...item,
          status,
          failureReason: status === 'failed' ? failureReason : null,
        };
      }
      return item;
    });
    
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
    return updatedQueue.find(item => item.requestId === requestId);
  } catch (error) {
    console.error(`Error updating status for item ${requestId}:`, error);
    throw error;
  }
};

// Clear the queue
export const clearQueue = async () => {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing queue:', error);
    return false;
  }
};

export default {
  getQueue,
  addToQueue,
  removeFromQueue,
  updateQueueItemStatus,
  clearQueue,
};
