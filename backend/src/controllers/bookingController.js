const pool = require('../config/db');

const getMyBookings = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT b.id, b.service_name AS "serviceName", b.date, b.price, b.status, b.icon, b.address, b.created_at, b.otp,
              v.name AS "vendorName", v.phone AS "vendorPhone"
       FROM bookings b
       LEFT JOIN vendors v ON b.vendor_id = v.id
       WHERE b.user_id = $1
       ORDER BY b.created_at DESC, b.id DESC`,
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

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Find the vendor with the least workload offering this service
    let assignedVendorId = null;
    let bookingStatus = 'Booked';

    const vendorQuery = await pool.query(`
      SELECT v.id, COUNT(b.id) AS booking_count
      FROM vendors v
      JOIN vendor_services vs ON v.id = vs.vendor_id
      JOIN services s ON vs.service_id = s.id
      LEFT JOIN bookings b ON v.id = b.vendor_id
      WHERE LOWER(s.title) = LOWER($1) AND v.status = 'Approved'
      GROUP BY v.id
      ORDER BY booking_count ASC, v.id ASC
      LIMIT 1
    `, [serviceName.trim()]);

    if (vendorQuery.rows.length > 0) {
      assignedVendorId = vendorQuery.rows[0].id;
      bookingStatus = 'Assigned';
    }

    // Insert booking
    const newBooking = await pool.query(
      'INSERT INTO bookings (id, user_id, service_name, date, price, status, icon, address, vendor_id, otp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, service_name AS "serviceName", date, price, status, icon, address, vendor_id AS "vendorId", otp',
      [randomId, userId, serviceName, dateAndSlot, price, bookingStatus, iconName, address, assignedVendorId, otp]
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
