import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Custom hook for using AsyncStorage with React state
 * @param {string} key - The key to store the value under
 * @param {any} initialValue - The initial value to use if no value is stored
 * @returns {[any, Function, boolean, string|null]} - [storedValue, setValue, loading, error]
 */
const useAsyncStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get from storage
  useEffect(() => {
    const getValueFromStorage = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const item = await AsyncStorage.getItem(key);
        const value = item ? JSON.parse(item) : initialValue;
        
        setStoredValue(value);
      } catch (error) {
        console.error(`Error reading from AsyncStorage (${key}):`, error);
        setError(`Failed to load data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    getValueFromStorage();
  }, [key, initialValue]);

  // Set to storage
  const setValue = async (value) => {
    try {
      setError(null);
      
      // Allow value to be a function
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to storage
      await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error writing to AsyncStorage (${key}):`, error);
      setError(`Failed to save data: ${error.message}`);
    }
  };

  return [storedValue, setValue, loading, error];
};

export default useAsyncStorage;
