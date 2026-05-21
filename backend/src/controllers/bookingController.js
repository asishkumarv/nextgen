const pool = require('../config/db');

const getMyBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT id, service_name AS "serviceName", date, price, status, icon, address, created_at FROM bookings WHERE user_id = $1 ORDER BY created_at DESC, id DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error retrieving bookings' });
  }
};

const createBooking = async (req, res) => {
  const { serviceName, price, date, timeSlot, address } = req.body;
  const userId = req.user.id;

  if (!serviceName || !price || !date || !address) {
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  try {
    // Generate Booking ID (e.g. B-1042)
    const randomId = `B-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Choose appropriate icon
    let iconName = 'construct-outline';
    if (serviceName.toLowerCase().includes('fan')) iconName = 'sync-outline';
    else if (serviceName.toLowerCase().includes('wiring')) iconName = 'flash-outline';
    else if (serviceName.toLowerCase().includes('switchboard') || serviceName.toLowerCase().includes('switch')) iconName = 'toggle-outline';

    const dateAndSlot = timeSlot ? `${date} (${timeSlot})` : date;

    // Insert booking (default status is 'Booked')
    const newBooking = await pool.query(
      'INSERT INTO bookings (id, user_id, service_name, date, price, status, icon, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, service_name AS "serviceName", date, price, status, icon, address',
      [randomId, userId, serviceName, dateAndSlot, price, 'Booked', iconName, address]
    );

    res.status(201).json(newBooking.rows[0]);

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
};

module.exports = {
  getMyBookings,
  createBooking
};
