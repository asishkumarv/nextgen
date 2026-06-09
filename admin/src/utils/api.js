const getApiUrl = () => {
  // Always point to production since the backend is not running locally
  return import.meta.env.VITE_API_URL || 'https://api.nextgenpowercare.com/api';
};


const BASE_URL = getApiUrl();

export const getAuthToken = () => localStorage.getItem('admin_token');
export const setAuthToken = (token) => localStorage.setItem('admin_token', token);
export const removeAuthToken = () => localStorage.removeItem('admin_token');

export const getAdminProfile = () => {
  const profile = localStorage.getItem('admin_profile');
  return profile ? JSON.parse(profile) : null;
};
export const setAdminProfile = (profile) => localStorage.setItem('admin_profile', JSON.stringify(profile));
export const removeAdminProfile = () => localStorage.removeItem('admin_profile');

const request = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
};

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
};
