import AsyncStorage from '@react-native-async-storage/async-storage';
import { extractVideoId } from '../utils';

// Storage keys
const SUMMARIES_PREFIX = '@summaries:';
const CACHE_INFO_KEY = '@cacheInfo';

// Helper function to get all keys with a specific prefix
const getKeysWithPrefix = async (prefix) => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    return allKeys.filter(key => key.startsWith(prefix));
  } catch (error) {
    console.error('Error getting keys with prefix:', error);
    return [];
  }
};

// Get a summary by video ID
export const getSummary = async (videoId) => {
  try {
    const key = `${SUMMARIES_PREFIX}${videoId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error getting summary for video ${videoId}:`, error);
    return null;
  }
};

// Get a summary by summary ID
export const getSummaryBySummaryId = async (summaryId) => {
  try {
    const keys = await getKeysWithPrefix(SUMMARIES_PREFIX);
    
    for (const key of keys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const summary = JSON.parse(data);
        const foundSummary = summary.summaries.find(s => s.summaryId === summaryId);
        
        if (foundSummary) {
          return {
            videoData: summary,
            summaryData: foundSummary
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting summary with ID ${summaryId}:`, error);
    return null;
  }
};

// Get all summaries
export const getAllSummaries = async () => {
  try {
    const keys = await getKeysWithPrefix(SUMMARIES_PREFIX);
    const results = [];
    
    for (const key of keys) {
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const summary = JSON.parse(data);
        // Add each individual summary to the results
        summary.summaries.forEach(s => {
          results.push({
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
          });
        });
      }
    }
    
    // Sort by creation date (newest first)
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return results;
  } catch (error) {
    console.error('Error getting all summaries:', error);
    return [];
  }
};

// Save a summary
export const saveSummary = async (summary) => {
  try {
    const videoId = summary.video_id || extractVideoId(summary.video_url);
    if (!videoId) {
      throw new Error('Invalid video ID or URL');
    }
    
    const key = `${SUMMARIES_PREFIX}${videoId}`;
    
    // Check if we already have data for this video
    const existingData = await getSummary(videoId);
    
    const summaryData = {
      summaryId: summary.id,
      text: summary.summary_text,
      type: summary.summary_type,
      length: summary.summary_length,
      timestamp: Date.now(),
      generatedAt: summary.created_at || new Date().toISOString(),
      is_starred: summary.is_starred || false,
    };
    
    if (existingData) {
      // Add the new summary to the existing data
      const updatedData = {
        ...existingData,
        title: summary.video_title || existingData.title,
        thumbnailUrl: summary.video_thumbnail_url || existingData.thumbnailUrl,
        thumbnailLocalUri: summary.thumbnailLocalUri || existingData.thumbnailLocalUri,
        lastAccessed: Date.now(),
        summaries: [
          ...existingData.summaries.filter(s => s.summaryId !== summaryData.summaryId),
          summaryData,
        ],
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(updatedData));
      return updatedData;
    } else {
      // Create new data for this video
      const newData = {
        videoId,
        url: summary.video_url,
        title: summary.video_title,
        thumbnailUrl: summary.video_thumbnail_url,
        thumbnailLocalUri: summary.thumbnailLocalUri || null,
        lastAccessed: Date.now(),
        summaries: [summaryData],
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(newData));
      return newData;
    }
  } catch (error) {
    console.error('Error saving summary:', error);
    throw error;
  }
};

// Update a summary
export const updateSummary = async (videoId, summaryId, updates) => {
  try {
    const key = `${SUMMARIES_PREFIX}${videoId}`;
    const existingData = await getSummary(videoId);
    
    if (!existingData) {
      throw new Error(`No summary found for video ${videoId}`);
    }
    
    const updatedSummaries = existingData.summaries.map(s => {
      if (s.summaryId === summaryId) {
        return { ...s, ...updates };
      }
      return s;
    });
    
    const updatedData = {
      ...existingData,
      lastAccessed: Date.now(),
      summaries: updatedSummaries,
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(updatedData));
    return updatedData;
  } catch (error) {
    console.error(`Error updating summary ${summaryId} for video ${videoId}:`, error);
    throw error;
  }
};

// Delete a summary
export const deleteSummary = async (videoId, summaryId) => {
  try {
    const key = `${SUMMARIES_PREFIX}${videoId}`;
    const existingData = await getSummary(videoId);
    
    if (!existingData) {
      return false;
    }
    
    // Filter out the summary to delete
    const updatedSummaries = existingData.summaries.filter(
      s => s.summaryId !== summaryId
    );
    
    if (updatedSummaries.length === 0) {
      // If no summaries left, remove the entire entry
      await AsyncStorage.removeItem(key);
    } else {
      // Update with remaining summaries
      const updatedData = {
        ...existingData,
        summaries: updatedSummaries,
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(updatedData));
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting summary ${summaryId} for video ${videoId}:`, error);
    return false;
  }
};

// Get starred summaries
export const getStarredSummaries = async () => {
  try {
    const allSummaries = await getAllSummaries();
    return allSummaries.filter(summary => summary.is_starred);
  } catch (error) {
    console.error('Error getting starred summaries:', error);
    return [];
  }
};

// Toggle star status
export const toggleStarStatus = async (videoId, summaryId, isStarred) => {
  try {
    return await updateSummary(videoId, summaryId, { is_starred: isStarred });
  } catch (error) {
    console.error(`Error toggling star status for summary ${summaryId}:`, error);
    throw error;
  }
};

// Get cache info
export const getCacheInfo = async () => {
  try {
    const data = await AsyncStorage.getItem(CACHE_INFO_KEY);
    return data ? JSON.parse(data) : {
      summariesSize: 0,
      thumbnailsSize: 0,
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error('Error getting cache info:', error);
    return {
      summariesSize: 0,
      thumbnailsSize: 0,
      lastUpdated: Date.now(),
    };
  }
};

// Update cache info
export const updateCacheInfo = async (updates) => {
  try {
    const currentInfo = await getCacheInfo();
    const updatedInfo = {
      ...currentInfo,
      ...updates,
      lastUpdated: Date.now(),
    };
    
    await AsyncStorage.setItem(CACHE_INFO_KEY, JSON.stringify(updatedInfo));
    return updatedInfo;
  } catch (error) {
    console.error('Error updating cache info:', error);
    throw error;
  }
};

// Clear all summaries
export const clearAllSummaries = async () => {
  try {
    const keys = await getKeysWithPrefix(SUMMARIES_PREFIX);
    
    if (keys.length > 0) {
      await AsyncStorage.multiRemove(keys);
    }
    
    // Update cache info
    await updateCacheInfo({ summariesSize: 0 });
    
    return true;
  } catch (error) {
    console.error('Error clearing all summaries:', error);
    return false;
  }
};

export default {
  getSummary,
  getSummaryBySummaryId,
  getAllSummaries,
  saveSummary,
  updateSummary,
  deleteSummary,
  getStarredSummaries,
  toggleStarStatus,
  getCacheInfo,
  updateCacheInfo,
  clearAllSummaries,
};
