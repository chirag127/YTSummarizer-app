/**
 * Tests for the serverWakeupService
 */

import axios from 'axios';
import * as apiConfigService from '../apiConfigService';
import { wakeupServer } from '../serverWakeupService';

// Mock dependencies
jest.mock('axios');
jest.mock('../apiConfigService');

describe('serverWakeupService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementation for getBaseUrl
    apiConfigService.getBaseUrl.mockResolvedValue('https://test-api.example.com');
  });
  
  it('should successfully wake up the server on first attempt', async () => {
    // Mock successful response
    axios.get.mockResolvedValueOnce({ status: 200, data: { message: 'API is running' } });
    
    // Mock status change callback
    const onStatusChange = jest.fn();
    
    // Call the function
    const result = await wakeupServer({ showLogs: false, onStatusChange });
    
    // Verify results
    expect(result).toBe(true);
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(axios.get).toHaveBeenCalledWith('https://test-api.example.com/', { timeout: 5000 });
    
    // Verify status change callback was called correctly
    expect(onStatusChange).toHaveBeenCalledTimes(2);
    expect(onStatusChange).toHaveBeenCalledWith({ status: 'connecting', message: 'Connecting to server...' });
    expect(onStatusChange).toHaveBeenCalledWith({ status: 'connected', message: 'Server is awake!' });
  });
  
  it('should retry on failure and eventually succeed', async () => {
    // Mock failed responses for first 2 attempts
    axios.get.mockRejectedValueOnce(new Error('Connection error'));
    axios.get.mockRejectedValueOnce(new Error('Connection error'));
    
    // Mock successful response on third attempt
    axios.get.mockResolvedValueOnce({ status: 200, data: { message: 'API is running' } });
    
    // Mock status change callback
    const onStatusChange = jest.fn();
    
    // Call the function
    const result = await wakeupServer({ showLogs: false, onStatusChange });
    
    // Verify results
    expect(result).toBe(true);
    expect(axios.get).toHaveBeenCalledTimes(3);
    
    // Verify status change callback was called correctly
    expect(onStatusChange).toHaveBeenCalledTimes(4); // connecting + 2 retries + connected
    expect(onStatusChange).toHaveBeenCalledWith({ status: 'connecting', message: 'Connecting to server...' });
    expect(onStatusChange).toHaveBeenCalledWith({ 
      status: 'retrying', 
      message: 'Retrying connection (1/5)...',
      attempt: 1,
      maxAttempts: 5
    });
    expect(onStatusChange).toHaveBeenCalledWith({ 
      status: 'retrying', 
      message: 'Retrying connection (2/5)...',
      attempt: 2,
      maxAttempts: 5
    });
    expect(onStatusChange).toHaveBeenCalledWith({ status: 'connected', message: 'Server is awake!' });
  });
  
  it('should fail after maximum retry attempts', async () => {
    // Mock failed responses for all attempts
    axios.get.mockRejectedValue(new Error('Connection error'));
    
    // Mock status change callback
    const onStatusChange = jest.fn();
    
    // Call the function
    const result = await wakeupServer({ showLogs: false, onStatusChange });
    
    // Verify results
    expect(result).toBe(false);
    expect(axios.get).toHaveBeenCalledTimes(5); // MAX_RETRY_ATTEMPTS
    
    // Verify status change callback was called correctly
    expect(onStatusChange).toHaveBeenCalledTimes(6); // connecting + 5 retries + failed
    expect(onStatusChange).toHaveBeenCalledWith({ status: 'connecting', message: 'Connecting to server...' });
    expect(onStatusChange).toHaveBeenCalledWith({ 
      status: 'failed', 
      message: 'Could not connect to server after 5 attempts' 
    });
  });
  
  it('should handle apiConfigService errors', async () => {
    // Mock error in getBaseUrl
    apiConfigService.getBaseUrl.mockRejectedValue(new Error('Config error'));
    
    // Call the function
    const result = await wakeupServer({ showLogs: false });
    
    // Verify results
    expect(result).toBe(false);
    expect(axios.get).not.toHaveBeenCalled();
  });
});
