import React, { createContext, useState, useContext, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../utils/api';

const VendorContext = createContext();

export const VendorProvider = ({ children }) => {
  const [token, setTokenState] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [stats, setStats] = useState({ assigned: 0, completed: 0, revenue: 0 });
  const [allStats, setAllStats] = useState({
    today: { assigned: 0, completed: 0, revenue: 0 },
    week: { assigned: 0, completed: 0, revenue: 0 },
    month: { assigned: 0, completed: 0, revenue: 0 },
    year: { assigned: 0, completed: 0, revenue: 0 },
    total: { assigned: 0, completed: 0, revenue: 0 }
  });
  const [settlements, setSettlements] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [unsettledBalance, setUnsettledBalance] = useState(0);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [allSystemServices, setAllSystemServices] = useState([]); // to select from during add-service
  const [isLoading, setIsLoading] = useState(true);

  // Restore vendor session on startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Fetch active services first (so registration forms can load them on mount)
        try {
          const servicesList = await api.get('/services');
          if (Array.isArray(servicesList)) {
            setAllSystemServices(servicesList);
          }
        } catch (err) {
          console.warn('Could not fetch active system services on mount:', err.message);
        }

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

  // Listen for 401 Unauthorized API responses globally to force auto-logout
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('UNAUTHORIZED', () => {
      console.log('Auto-logout triggered due to expired or invalid token');
      logout();
    });
    return () => subscription.remove();
  }, []);

  const loadVendorData = async () => {
    try {
      // 1. Fetch profile, stats, services and bookings in one call
      const data = await api.get('/vendor/me');
      setVendor(data.profile);
      setStats(data.stats);
      setAllStats(data.allStats || { today: data.stats });
      setServices(data.services);
      setBookings(data.bookings);

      // Fetch leaves and settlements
      await fetchSettlementsAndLeaves();

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

  const fetchSettlementsAndLeaves = async () => {
    try {
      const leavesData = await api.get('/vendor/leaves');
      setLeaves(leavesData || []);

      const settlementsData = await api.get('/vendor/settlements');
      setSettlements(settlementsData.settlements || []);
      setUnsettledBalance(settlementsData.unsettledBalance || 0);
    } catch (err) {
      console.warn('Error fetching settlements/leaves:', err.message);
    }
  };

  const login = async (phone, password) => {
    try {
      const data = await api.post('/vendor/login', { phone, password });
      await setAuthToken(data.token);
      
      // Load all data before setting token state so transition is instant
      await loadVendorData();
      
      setTokenState(data.token);
      setVendor(data.vendor);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const register = async (name, phone, password, existingServices, newService, districtId, mandalId) => {
    try {
      const data = await api.post('/vendor/register', {
        name,
        phone,
        password,
        existingServices,
        newService,
        districtId,
        mandalId
      });
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    await removeAuthToken();
    setTokenState(null);
    setVendor(null);
    setStats({ assigned: 0, completed: 0, revenue: 0 });
    setAllStats({
      today: { assigned: 0, completed: 0, revenue: 0 },
      week: { assigned: 0, completed: 0, revenue: 0 },
      month: { assigned: 0, completed: 0, revenue: 0 },
      year: { assigned: 0, completed: 0, revenue: 0 },
      total: { assigned: 0, completed: 0, revenue: 0 }
    });
    setSettlements([]);
    setLeaves([]);
    setUnsettledBalance(0);
    setServices([]);
    setBookings([]);
  };

  const completeTask = async (taskId, otp) => {
    try {
      const res = await api.put(`/vendor/tasks/${taskId}/complete`, { otp });
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

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await api.put('/vendor/change-password', { currentPassword, newPassword });
      return { success: res.success, message: res.message };
    } catch (error) {
      console.error('Failed to change password:', error);
      return { success: false, message: error.message || 'Failed to change password' };
    }
  };

  const addLeave = async (leaveDate) => {
    try {
      const res = await api.post('/vendor/leaves', { leaveDate });
      if (res.success) {
        await fetchSettlementsAndLeaves();
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to add leave:', error);
      return { success: false, message: error.message || 'Failed to declare leave' };
    }
  };

  const removeLeave = async (leaveDate) => {
    try {
      const res = await api.delete(`/vendor/leaves/${leaveDate}`);
      if (res.success) {
        await fetchSettlementsAndLeaves();
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to remove leave:', error);
      return { success: false, message: error.message || 'Failed to remove leave' };
    }
  };

  const requestSettlement = async () => {
    try {
      const res = await api.post('/vendor/settlements');
      if (res.success) {
        await fetchSettlementsAndLeaves();
        const data = await api.get('/vendor/me');
        setVendor(data.profile);
        setStats(data.stats);
        setAllStats(data.allStats || { today: data.stats });
        setBookings(data.bookings);
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to request settlement:', error);
      return { success: false, message: error.message || 'Failed to request settlement' };
    }
  };

  return (
    <VendorContext.Provider
      value={{
        token,
        vendor,
        stats,
        allStats,
        settlements,
        leaves,
        unsettledBalance,
        services,
        bookings,
        allSystemServices,
        isLoading,
        login,
        register,
        logout,
        completeTask,
        addService,
        changePassword,
        addLeave,
        removeLeave,
        requestSettlement,
        refreshData: loadVendorData,
        refreshSettlementsAndLeaves: fetchSettlementsAndLeaves
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
