import React, { createContext, useState, useContext, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../utils/api';

const VendorContext = createContext();

export const VendorProvider = ({ children }) => {
  const [token, setTokenState] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [stats, setStats] = useState({ assigned: 0, completed: 0, revenue: 0 });
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [allSystemServices, setAllSystemServices] = useState([]); // to select from during add-service
  const [isLoading, setIsLoading] = useState(true);

  // Restore vendor session on startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await getAuthToken();
        if (storedToken) {
          setTokenState(storedToken);
          await loadVendorData();
        }
      } catch (e) {
        console.error('Restoring vendor token failed:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, [token]);

  const loadVendorData = async () => {
    try {
      // 1. Fetch profile, stats, services and bookings in one call
      const data = await api.get('/vendor/me');
      setVendor(data.profile);
      setStats(data.stats);
      setServices(data.services);
      setBookings(data.bookings);

      // Also load all active services in system for search/selection
      try {
        const servicesList = await api.get('/services');
        if (Array.isArray(servicesList)) {
          setAllSystemServices(servicesList);
        }
      } catch (err) {
        console.warn('Could not fetch active system services:', err.message);
      }

    } catch (error) {
      console.error('Error loading vendor app data:', error);
      // Clear token on invalid profile fetch
      if (error.status === 401 || (error.message && error.message.toLowerCase().includes('token'))) {
        await logout();
      }
    }
  };

  const login = async (phone, password) => {
    setIsLoading(true);
    try {
      const data = await api.post('/vendor/login', { phone, password });
      await setAuthToken(data.token);
      setTokenState(data.token);
      setVendor(data.vendor);
      await loadVendorData();
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      setIsLoading(false);
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const register = async (name, phone, password, existingServices, newService) => {
    setIsLoading(true);
    try {
      const data = await api.post('/vendor/register', {
        name,
        phone,
        password,
        existingServices,
        newService
      });
      setIsLoading(false);
      return { success: true, message: data.message };
    } catch (error) {
      setIsLoading(false);
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    await removeAuthToken();
    setTokenState(null);
    setVendor(null);
    setStats({ assigned: 0, completed: 0, revenue: 0 });
    setServices([]);
    setBookings([]);
  };

  const completeTask = async (taskId) => {
    try {
      const res = await api.put(`/vendor/tasks/${taskId}/complete`);
      if (res.success) {
        // Reload dashboard details
        await loadVendorData();
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
      return { success: false, message: error.message || 'Failed to complete task' };
    }
  };

  const addService = async (serviceId, customServiceData) => {
    try {
      const res = await api.post('/vendor/services', {
        serviceId,
        newService: customServiceData
      });
      if (res.success) {
        await loadVendorData();
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to link service:', error);
      return { success: false, message: error.message || 'Failed to add service' };
    }
  };

  return (
    <VendorContext.Provider
      value={{
        token,
        vendor,
        stats,
        services,
        bookings,
        allSystemServices,
        isLoading,
        login,
        register,
        logout,
        completeTask,
        addService,
        refreshData: loadVendorData
      }}
    >
      {children}
    </VendorContext.Provider>
  );
};

export const useVendor = () => {
  const context = useContext(VendorContext);
  if (!context) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
};
