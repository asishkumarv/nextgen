import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getApiUrl = () => {
  // Use Render production backend URL by default as requested.
  return 'https://nextgen-8hi5.onrender.com/api';

  /*
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:5000/api';
    }
  }
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
  if (isDev) {
    // If running in development on a native device/emulator, dynamically resolve local IP
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      return `http://${ip}:5000/api`;
    }
    return 'http://localhost:5000/api';
  }
  // Production URL (Render backend)
  return 'https://nextgen-8hi5.onrender.com/api';
  */
};

export const API_URL = getApiUrl();
console.log('Detected API URL:', API_URL);

// In-memory fallback storage when AsyncStorage native module is null or fails
const memoryStorage = {};

const safeStorage = {
  getItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : memoryStorage[key] || null;
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn('AsyncStorage.getItem failed, falling back to memory/localStorage:', error);
      return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : memoryStorage[key] || null;
    }
  },
  setItem: async (key, value) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        } else {
          memoryStorage[key] = value;
        }
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn('AsyncStorage.setItem failed, falling back to memory/localStorage:', error);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      } else {
        memoryStorage[key] = value;
      }
    }
  },
  removeItem: async (key) => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        } else {
          delete memoryStorage[key];
        }
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('AsyncStorage.removeItem failed, falling back to memory/localStorage:', error);
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      } else {
        delete memoryStorage[key];
      }
    }
  }
};

export const getAuthToken = async () => {
  try {
    return await safeStorage.getItem('user_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

export const setAuthToken = async (token) => {
  try {
    await safeStorage.setItem('user_token', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

export const removeAuthToken = async () => {
  try {
    await safeStorage.removeItem('user_token');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

const request = async (endpoint, options = {}) => {
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error.message);
    throw error;
  }
};

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
};
