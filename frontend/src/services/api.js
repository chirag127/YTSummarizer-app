import axios from 'axios';

// Base URL for API calls - change this to your backend URL
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
export const validateYouTubeUrl = async (url) => {
  try {
    const response = await api.post('/validate-url', {
      url,
      summary_type: 'Brief',
      summary_length: 'Medium',
    });
    return response.data;
  } catch (error) {
    console.error('Error validating URL:', error);
    throw error;
  }
};

export const generateSummary = async (url, summaryType, summaryLength) => {
  try {
    const response = await api.post('/generate-summary', {
      url,
      summary_type: summaryType,
      summary_length: summaryLength,
    });
    return response.data;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
};

export const getAllSummaries = async () => {
  try {
    const response = await api.get('/summaries');
    return response.data;
  } catch (error) {
    console.error('Error fetching summaries:', error);
    throw error;
  }
};

export const getSummaryById = async (id) => {
  try {
    const response = await api.get(`/summaries/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching summary with ID ${id}:`, error);
    throw error;
  }
};

export const updateSummary = async (id, summaryType, summaryLength) => {
  try {
    const response = await api.put(`/summaries/${id}`, {
      summary_type: summaryType,
      summary_length: summaryLength,
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating summary with ID ${id}:`, error);
    throw error;
  }
};

export const deleteSummary = async (id) => {
  try {
    const response = await api.delete(`/summaries/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting summary with ID ${id}:`, error);
    throw error;
  }
};

export default {
  validateYouTubeUrl,
  generateSummary,
  getAllSummaries,
  getSummaryById,
  updateSummary,
  deleteSummary,
};
