import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('nextgen_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async (authToken) => {
    try {
      const data = await api.get('/auth/me');
      setUser(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      // If token is invalid/expired, clear it
      if (err.status === 401 || err.status === 404) {
        logout();
      }
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile(token);
    } else {
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const login = async (phone, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post('/auth/login', { phone, password });
      localStorage.setItem('nextgen_token', data.token);
      setToken(data.token);
      return data;
    } catch (err) {
      setError(err.message || 'Login failed');
      setLoading(false);
      throw err;
    }
  };

  const signup = async (name, phone, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.post('/auth/register', { name, phone, password });
      localStorage.setItem('nextgen_token', data.token);
      setToken(data.token);
      return data;
    } catch (err) {
      setError(err.message || 'Signup failed');
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('nextgen_token');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchProfile(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
