import { YOUTUBE_URL_REGEX } from '../constants';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';

// Validate YouTube URL
export const isValidYouTubeUrl = (url) => {
  return YOUTUBE_URL_REGEX.test(url);
};

// Extract video ID from YouTube URL
export const extractVideoId = (url) => {
  if (!url) return null;
  
  // Handle youtu.be format
  if (url.includes('youtu.be')) {
    const parts = url.split('/');
    return parts[parts.length - 1].split('?')[0];
  }
  
  // Handle youtube.com format
  const urlObj = new URL(url);
  if (urlObj.hostname.includes('youtube.com')) {
    return urlObj.searchParams.get('v');
  }
  
  return null;
};

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Copy text to clipboard
export const copyToClipboard = async (text) => {
  try {
    await Clipboard.setStringAsync(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

// Open URL in browser
export const openUrl = async (url) => {
  try {
    await WebBrowser.openBrowserAsync(url);
    return true;
  } catch (error) {
    console.error('Error opening URL:', error);
    return false;
  }
};

// Get YouTube thumbnail URL from video ID
export const getYouTubeThumbnail = (videoId) => {
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

// Get placeholder thumbnail
export const getPlaceholderThumbnail = () => {
  return 'https://via.placeholder.com/480x360?text=No+Thumbnail';
};

// Format summary type for display
export const formatSummaryType = (type) => {
  return type || 'Brief';
};

// Format summary length for display
export const formatSummaryLength = (length) => {
  return length || 'Medium';
};

export default {
  isValidYouTubeUrl,
  extractVideoId,
  formatDate,
  truncateText,
  copyToClipboard,
  openUrl,
  getYouTubeThumbnail,
  getPlaceholderThumbnail,
  formatSummaryType,
  formatSummaryLength,
};
