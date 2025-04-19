import { YOUTUBE_URL_REGEX } from "../constants";
import * as Clipboard from "expo-clipboard";
import * as WebBrowser from "expo-web-browser";

// URL validation removed as per requirement
export const isValidYouTubeUrl = (url) => {
    // Always return true to bypass validation
    return true;
};

// Extract video ID from YouTube URL
export const extractVideoId = (url) => {
    if (!url) return null;

    try {
        // Handle youtu.be format
        if (url.includes("youtu.be")) {
            const parts = url.split("/");
            // Get the last part which may contain query parameters
            const lastPart = parts[parts.length - 1];
            // Split at the first question mark to remove query parameters
            return lastPart.split("?")[0];
        }

        // Handle youtube.com and m.youtube.com format
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname.includes("youtube.com")) {
                return urlObj.searchParams.get("v");
            }
        } catch (error) {
            console.log("Error parsing URL:", error);
            // Extract video ID from URL using regex as fallback
            const match = url.match(/[?&]v=([^&]+)/);
            return match ? match[1] : null;
        }
    } catch (error) {
        console.log("Error extracting video ID:", error);
        // Return a default value or generate a random ID
        return "dQw4w9WgXcQ"; // Default to a known video ID as fallback
    }

    return null;
};

// Format date
export const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
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
        console.error("Error copying to clipboard:", error);
        return false;
    }
};

// Open URL in browser
export const openUrl = async (url) => {
    try {
        await WebBrowser.openBrowserAsync(url);
        return true;
    } catch (error) {
        console.error("Error opening URL:", error);
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
    return "https://via.placeholder.com/480x360?text=No+Thumbnail";
};

// Format summary type for display
export const formatSummaryType = (type) => {
    return type || "Brief";
};

// Format summary length for display
export const formatSummaryLength = (length) => {
    return length || "Medium";
};

// Parse markdown to plain text for TTS
export const parseMarkdownToPlainText = (markdown) => {
    if (!markdown) return "";

    // Remove headings (# Heading)
    let plainText = markdown.replace(/^#+\s+(.+)$/gm, "$1");

    // Remove bold and italic (**bold**, *italic*)
    plainText = plainText.replace(/\*\*(.+?)\*\*/g, "$1");
    plainText = plainText.replace(/\*(.+?)\*/g, "$1");

    // Remove links ([text](url))
    plainText = plainText.replace(/\[(.+?)\]\(.+?\)/g, "$1");

    // Replace bullet points with a dash and space
    plainText = plainText.replace(/^\s*[\*\-\+]\s+/gm, "- ");

    // Replace numbered lists with the number and a period
    plainText = plainText.replace(/^\s*\d+\.\s+/gm, function (match) {
        return match; // Keep the numbering
    });

    // Replace code blocks and inline code
    plainText = plainText.replace(/```[\s\S]*?```/g, ""); // Remove code blocks
    plainText = plainText.replace(/`(.+?)`/g, "$1"); // Keep inline code content

    // Replace blockquotes
    plainText = plainText.replace(/^>\s+(.+)$/gm, "$1");

    // Replace multiple newlines with a single one
    plainText = plainText.replace(/\n{3,}/g, "\n\n");

    return plainText.trim();
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
    parseMarkdownToPlainText,
};
