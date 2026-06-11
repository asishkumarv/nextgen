import React, { createContext, useState, useContext, useEffect } from 'react';
import { api, getAuthToken, setAuthToken, removeAuthToken } from '../utils/api';
import { services as staticServices } from '../data/services';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [bookedSlot, setBookedSlot] = useState(null); // kept for backward compatibility if needed, or we can just ignore it
  const [subscriptions, setSubscriptions] = useState([]); // array of subscription info
  const [activeBookingService, setActiveBookingService] = useState(null); // service selection
  const [bookings, setBookings] = useState([]); // user bookings
  const [dbBookedSlots, setDbBookedSlots] = useState(new Set()); // all slots booked in database
  const [services, setServices] = useState(staticServices);

  // Check login status on startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await getAuthToken();
        if (storedToken) {
          setTokenState(storedToken);
          await loadAppData();
        }
      } catch (e) {
        console.error('Restoring token failed:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
    fetchDbBookedSlots();
  }, [token]);

  const fetchDbBookedSlots = async () => {
    try {
      const data = await api.get('/subscription/booked');
      if (data && data.bookedSlots) {
        const parsedSlots = data.bookedSlots.map(num => Number(num)).filter(num => !isNaN(num));
        setDbBookedSlots(new Set(parsedSlots));
      }
    } catch (error) {
      console.warn('Failed to load booked slots registry:', error.message);
    }
  };

  const loadAppData = async () => {
    try {
      // 1. Fetch profile & active subscription
      const profile = await api.get('/auth/me');
      setUser({
        name: profile.name,
        phone: profile.phone,
        walletBalance: profile.wallet_balance || 0,
        referralCode: profile.referral_code || ''
      });

      if (profile.subscriptions && profile.subscriptions.length > 0) {
        const activeSub = profile.subscriptions.find(s => s.status === 'Active');
        setBookedSlot(activeSub ? activeSub.slotNumber : null); // keep for backward compat for single slot scenarios
        
        const formattedSubs = profile.subscriptions.map(sub => {
          const subDate = new Date(sub.validTill);
          const formattedDate = subDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });
          
          return {
            id: sub.id,
            plan: sub.plan,
            date: formattedDate,
            slotNumber: sub.slotNumber,
            districtId: sub.districtId,
            mandalId: sub.mandalId,
            districtName: sub.districtName,
            mandalName: sub.mandalName,
            eventName: sub.eventName,
            status: sub.status,
            paymentMode: sub.paymentMode,
          };
        });
        setSubscriptions(formattedSubs);
      } else {
        setBookedSlot(null);
        setSubscriptions([]);
      }

      // 2. Fetch bookings list
      const bookingsList = await api.get('/bookings');
      setBookings(bookingsList);

      // 3. Fetch services list
      try {
        const servicesList = await api.get('/services');
        if (Array.isArray(servicesList)) {
          setServices(servicesList);
        }
      } catch (err) {
        console.warn('Failed to retrieve services from database, using static fallback:', err.message);
      }

    } catch (error) {
      console.error('Error loading app data:', error);
      // If unauthorized token, clear session
      if (error.message && error.message.toLowerCase().includes('unauthorized') || error.message.toLowerCase().includes('token')) {
        await logout();
      }
    }
  };

  const login = async (phone, password) => {
    try {
      const data = await api.post('/auth/login', { phone, password });
      await setAuthToken(data.token);
      
      // Load all data before setting token state so transition is instant
      await loadAppData();
      await fetchDbBookedSlots();
      
      setTokenState(data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Login failed' };
    }
  };

  const register = async (name, phone, password, referralCode, district_id, mandal_id, address, email) => {
    try {
      const data = await api.post('/auth/register', { name, phone, password, referralCode, district_id, mandal_id, address, email });
      await setAuthToken(data.token);
      
      // Load all data before setting token state so transition is instant
      await loadAppData();
      await fetchDbBookedSlots();
      
      setTokenState(data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    await removeAuthToken();
    setTokenState(null);
    setUser(null);
    setBookedSlot(null);
    setSubscriptions([]);
    setBookings([]);
    setServices(staticServices);
  };

  const updateProfile = async (name, phone) => {
    try {
      const updated = await api.put('/auth/profile', { name, phone });
      setUser({ name: updated.name, phone: updated.phone });
      return { success: true };
    } catch (error) {
      console.error('Failed to update profile:', error);
      return { success: false, message: error.message || 'Failed to update profile' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const res = await api.put('/auth/change-password', { currentPassword, newPassword });
      return { success: res.success, message: res.message };
    } catch (error) {
      console.error('Failed to change password:', error);
      return { success: false, message: error.message || 'Failed to change password' };
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const res = await api.put(`/bookings/${bookingId}/cancel`);
      await loadAppData();
      return { success: res.success, message: res.message };
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      return { success: false, message: error.message || 'Failed to cancel booking' };
    }
  };

  const bookSlot = async (districtId, mandalId, eventId, slotNumber, paymentMode, transactionId, screenshotUrl) => {
    try {
      const res = await api.post('/subscription/book', { 
        districtId, 
        mandalId, 
        eventId, 
        slotNumber, 
        paymentMode, 
        transactionId, 
        screenshotUrl 
      });
      if (res.success) {
        await loadAppData();
        await fetchDbBookedSlots();
        return { success: true };
      }
    } catch (error) {
      console.error('Error reserving subscription slot:', error);
      return { success: false, message: error.message || 'Failed to book slot' };
    }
  };

  const cancelSlot = async (subscriptionId) => {
    try {
      const res = await api.post('/subscription/cancel', { subscriptionId });
      if (res.success) {
        await loadAppData(); // reload subscriptions from backend
        await fetchDbBookedSlots();
        return { success: true };
      }
    } catch (error) {
      console.error('Error canceling subscription slot:', error);
      return { success: false, message: error.message || 'Failed to cancel slot' };
    }
  };

  const addBooking = async (serviceName, price, date, timeSlot, address, districtId, mandalId, slotNumber, eventName) => {
    try {
      const newBooking = await api.post('/bookings', {
        serviceName,
        price,
        date,
        timeSlot,
        address,
        districtId,
        mandalId,
        slotNumber,
        eventName
      });

      // Update state list
      setBookings((prevBookings) => [newBooking, ...prevBookings]);
      return newBooking.id;
    } catch (error) {
      console.error('Error creating service booking:', error);
      throw error;
    }
  };

  return (
    <AppContext.Provider
      value={{
        token,
        user,
        isLoading,
        bookedSlot,
        subscriptions,
        bookings,
        activeBookingService,
        dbBookedSlots,
        services,
        setActiveBookingService,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        cancelBooking,
        bookSlot,
        cancelSlot,
        addBooking,
        refreshBookedSlots: fetchDbBookedSlots,
        refreshData: async () => {
          await loadAppData();
          await fetchDbBookedSlots();
        },
        refreshServices: async () => {
          try {
            const servicesList = await api.get('/services');
            if (Array.isArray(servicesList)) {
              setServices(servicesList);
            }
          } catch (err) {
            console.warn('Failed to refresh services:', err.message);
          }
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
