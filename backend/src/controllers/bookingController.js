const pool = require('../config/db');

const parseToDateString = (dateStr) => {
  if (!dateStr) return '';
  const datePart = dateStr.split('(')[0].trim();
  const hasYear = /\b\d{4}\b/.test(datePart);
  let d;
  if (!hasYear) {
    const currentYear = new Date().getFullYear();
    d = new Date(`${datePart} ${currentYear}`);
  } else {
    d = new Date(datePart);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  const { serviceName, price, date, timeSlot, address, districtId, mandalId, slotNumber, eventName } = req.body;
  const userId = req.user.id;

  if (!serviceName || !date || !address) {
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  try {
    // Generate unique Booking ID (e.g. B-1042)
    let randomId;
    let isUnique = false;
    while (!isUnique) {
      randomId = `B-${Math.floor(1000 + Math.random() * 9000)}`;
      const check = await pool.query('SELECT id FROM bookings WHERE id = $1', [randomId]);
      if (check.rows.length === 0) {
        isUnique = true;
      }
    }
    
    // Choose appropriate icon
    let iconName = 'construct-outline';
    if (serviceName.toLowerCase().includes('fan')) iconName = 'sync-outline';
    else if (serviceName.toLowerCase().includes('wiring')) iconName = 'flash-outline';
    else if (serviceName.toLowerCase().includes('switchboard') || serviceName.toLowerCase().includes('switch')) iconName = 'toggle-outline';

    const dateAndSlot = timeSlot ? `${date} (${timeSlot})` : date;

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Check subscription status
    const subCheck = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
    const isSubscribed = subCheck.rows.length > 0;
    
    let computedPrice = parseFloat(price || 0);
    let finalDistrictId = districtId;
    let finalMandalId = mandalId;
    let finalEventName = eventName;
    let finalSlotNumber = slotNumber;

    if (isSubscribed) {
      computedPrice = 0.00;
      const sub = subCheck.rows[0];
      if (!finalDistrictId) finalDistrictId = sub.district_id;
      if (!finalMandalId) finalMandalId = sub.mandal_id;
      if (!finalEventName) finalEventName = sub.event_name;
      if (!finalSlotNumber) finalSlotNumber = sub.slot_number;
    } else if (mandalId) {
      const mandalRes = await pool.query('SELECT booking_price FROM mandals WHERE id = $1', [mandalId]);
      if (mandalRes.rows.length > 0) {
        computedPrice = parseFloat(mandalRes.rows[0].booking_price);
      }
    }

    // Find the vendor with the least workload offering this service
    let assignedVendorId = null;
    let bookingStatus = 'Booked';

    const leaveDateCheck = parseToDateString(date);

    const vendorQuery = await pool.query(`
      SELECT v.id, COUNT(CASE WHEN b.status = 'Assigned' THEN 1 END) AS booking_count
      FROM vendors v
      JOIN vendor_services vs ON v.id = vs.vendor_id
      JOIN services s ON vs.service_id = s.id
      LEFT JOIN bookings b ON v.id = b.vendor_id
      WHERE LOWER(s.title) = LOWER($1) 
        AND v.status = 'Approved'
        AND v.district_id = $2
        AND v.mandal_id = $3
        AND v.id NOT IN (
          SELECT vendor_id FROM vendor_leaves WHERE leave_date = $4
        )
      GROUP BY v.id
      ORDER BY booking_count ASC, v.id ASC
      LIMIT 1
    `, [serviceName.trim(), finalDistrictId, finalMandalId, leaveDateCheck]);

    if (vendorQuery.rows.length > 0) {
      assignedVendorId = vendorQuery.rows[0].id;
      bookingStatus = 'Assigned';
    }

    // Insert booking
    const newBooking = await pool.query(
      `INSERT INTO bookings (id, user_id, district_id, mandal_id, event_name, slot_number, service_name, date, price, status, icon, address, vendor_id, otp) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
       RETURNING id, service_name AS "serviceName", date, price, status, icon, address, vendor_id AS "vendorId", otp,
                 district_id AS "districtId", mandal_id AS "mandalId", event_name AS "eventName", slot_number AS "slotNumber"`,
      [randomId, userId, finalDistrictId || null, finalMandalId || null, finalEventName || null, finalSlotNumber || null, serviceName, dateAndSlot, computedPrice, bookingStatus, iconName, address, assignedVendorId, otp]
    );

    res.status(201).json(newBooking.rows[0]);

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
};

const cancelBooking = async (req, res) => {
  const bookingId = req.params.id;
  const userId = req.user.id;

  try {
    const bookingQuery = await pool.query('SELECT * FROM bookings WHERE id = $1 AND user_id = $2', [bookingId, userId]);
    if (bookingQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingQuery.rows[0];
    if (booking.status === 'Completed') {
      return res.status(400).json({ message: 'Completed bookings cannot be cancelled' });
    }
    if (booking.status === 'Cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    const result = await pool.query(
      "UPDATE bookings SET status = 'Cancelled' WHERE id = $1 RETURNING *",
      [bookingId]
    );

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: result.rows[0]
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error cancelling booking' });
  }
};

module.exports = {
  getMyBookings,
  createBooking,
  cancelBooking
};
