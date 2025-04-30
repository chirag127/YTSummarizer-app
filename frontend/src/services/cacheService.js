import * as FileSystem from 'expo-file-system';
import { updateCacheInfo, getCacheInfo } from './storageService';

// Constants
const CACHE_DIRECTORY = `${FileSystem.cacheDirectory}thumbnails/`;
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB

// Ensure cache directory exists
const ensureCacheDirectory = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIRECTORY, { intermediates: true });
    }
    return true;
  } catch (error) {
    console.error('Error ensuring cache directory exists:', error);
    return false;
  }
};

// Initialize cache
export const initializeCache = async () => {
  return await ensureCacheDirectory();
};

// Cache an image
export const cacheImage = async (url, videoId) => {
  if (!url || !videoId) return null;
  
  try {
    await ensureCacheDirectory();
    
    // Generate a filename based on the videoId
    const filename = `${videoId}.jpg`;
    const filePath = `${CACHE_DIRECTORY}${filename}`;
    
    // Check if file already exists
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      return filePath;
    }
    
    // Download the image
    const downloadResult = await FileSystem.downloadAsync(url, filePath);
    
    if (downloadResult.status === 200) {
      // Update cache info
      const fileSize = (await FileSystem.getInfoAsync(filePath)).size || 0;
      const cacheInfo = await getCacheInfo();
      await updateCacheInfo({
        thumbnailsSize: cacheInfo.thumbnailsSize + fileSize,
      });
      
      // Check if we need to apply LRU eviction
      await applyLRUEvictionIfNeeded();
      
      return filePath;
    } else {
      console.error('Failed to download image:', downloadResult);
      return null;
    }
  } catch (error) {
    console.error(`Error caching image for video ${videoId}:`, error);
    return null;
  }
};

// Get cached image
export const getCachedImage = async (videoId) => {
  if (!videoId) return null;
  
  try {
    const filename = `${videoId}.jpg`;
    const filePath = `${CACHE_DIRECTORY}${filename}`;
    
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      return filePath;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting cached image for video ${videoId}:`, error);
    return null;
  }
};

// Get cache size
export const getCacheSize = async () => {
  try {
    await ensureCacheDirectory();
    
    const dirContents = await FileSystem.readDirectoryAsync(CACHE_DIRECTORY);
    let totalSize = 0;
    
    for (const file of dirContents) {
      const fileInfo = await FileSystem.getInfoAsync(`${CACHE_DIRECTORY}${file}`);
      if (fileInfo.exists && !fileInfo.isDirectory) {
        totalSize += fileInfo.size;
      }
    }
    
    // Update cache info with actual size
    await updateCacheInfo({ thumbnailsSize: totalSize });
    
    return totalSize;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
};

// Clear image cache
export const clearImageCache = async () => {
  try {
    await ensureCacheDirectory();
    
    const dirContents = await FileSystem.readDirectoryAsync(CACHE_DIRECTORY);
    
    for (const file of dirContents) {
      await FileSystem.deleteAsync(`${CACHE_DIRECTORY}${file}`);
    }
    
    // Update cache info
    await updateCacheInfo({ thumbnailsSize: 0 });
    
    return true;
  } catch (error) {
    console.error('Error clearing image cache:', error);
    return false;
  }
};

// Apply LRU eviction if needed
export const applyLRUEvictionIfNeeded = async () => {
  try {
    const cacheInfo = await getCacheInfo();
    
    // If cache size is below the limit, no need to evict
    if (cacheInfo.thumbnailsSize < MAX_CACHE_SIZE) {
      return false;
    }
    
    // Get all cached files with their info
    const dirContents = await FileSystem.readDirectoryAsync(CACHE_DIRECTORY);
    const fileInfos = [];
    
    for (const file of dirContents) {
      const filePath = `${CACHE_DIRECTORY}${file}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      if (fileInfo.exists && !fileInfo.isDirectory) {
        fileInfos.push({
          path: filePath,
          size: fileInfo.size,
          modificationTime: fileInfo.modificationTime || 0,
        });
      }
    }
    
    // Sort by modification time (oldest first)
    fileInfos.sort((a, b) => a.modificationTime - b.modificationTime);
    
    // Remove oldest files until we're under the limit
    let currentSize = cacheInfo.thumbnailsSize;
    let removedSize = 0;
    
    for (const file of fileInfos) {
      if (currentSize <= MAX_CACHE_SIZE * 0.8) {
        // Stop when we've reduced to 80% of max
        break;
      }
      
      await FileSystem.deleteAsync(file.path);
      currentSize -= file.size;
      removedSize += file.size;
    }
    
    // Update cache info
    if (removedSize > 0) {
      await updateCacheInfo({
        thumbnailsSize: cacheInfo.thumbnailsSize - removedSize,
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error applying LRU eviction:', error);
    return false;
  }
};

export default {
  initializeCache,
  cacheImage,
  getCachedImage,
  getCacheSize,
  clearImageCache,
  applyLRUEvictionIfNeeded,
};
