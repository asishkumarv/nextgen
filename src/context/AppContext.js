import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: 'Ravi Kumar',
    phone: '+91 98765 43210',
  });

  const [bookedSlot, setBookedSlot] = useState(null); // stores slot number when booked, e.g. 114
  const [bookingDetails, setBookingDetails] = useState(null); // stores details of the booked slot
  const [activeBookingService, setActiveBookingService] = useState(null); // stores service being booked

  const [bookings, setBookings] = useState([

    {
      id: 'B-1042',
      serviceName: 'Fan Repair',
      date: '12 Apr 2026',
      price: 149,
      status: 'Completed',
      icon: 'sync-outline', // Propeller-like icon
    },
    {
      id: 'B-1031',
      serviceName: 'Switchboard Repair',
      date: '28 Mar 2026',
      price: 99,
      status: 'Completed',
      icon: 'toggle-outline', // Toggle/switch icon
    },
    {
      id: 'B-1019',
      serviceName: 'Wiring Issue',
      date: '14 Feb 2026',
      price: 299,
      status: 'Completed',
      icon: 'flash-outline', // Lightning/wiring icon
    },
  ]);

  const updateProfile = (name, phone) => {
    setUser({ name, phone });
  };

  const bookSlot = (slotNumber) => {
    const randomId = `NGPC-${Math.floor(100000 + Math.random() * 900000)}`;
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }); // e.g., "29 Apr 2026" (or current date)
    
    setBookedSlot(slotNumber);
    setBookingDetails({
      id: randomId,
      plan: 'Annual · ₹2999/year',
      date: formattedDate,
      slotNumber: slotNumber,
    });
  };

  const cancelSlot = () => {
    setBookedSlot(null);
    setBookingDetails(null);
  };

  const addBooking = (serviceName, price, date, timeSlot, address) => {
    const randomId = `B-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Choose appropriate icon
    let iconName = 'construct-outline';
    if (serviceName.toLowerCase().includes('fan')) iconName = 'sync-outline';
    else if (serviceName.toLowerCase().includes('wiring')) iconName = 'flash-outline';
    else if (serviceName.toLowerCase().includes('switchboard') || serviceName.toLowerCase().includes('switch')) iconName = 'toggle-outline';

    const newBooking = {
      id: randomId,
      serviceName,
      date: `${date} (${timeSlot})`,
      price,
      status: 'Completed', // auto-completed for the dummy/working model representation
      icon: iconName,
      address,
    };

    setBookings((prevBookings) => [newBooking, ...prevBookings]);
    return randomId;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        bookedSlot,
        bookingDetails,
        bookings,
        activeBookingService,
        setActiveBookingService,
        updateProfile,
        bookSlot,
        cancelSlot,
        addBooking,
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
