const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const vendorRegister = async (req, res) => {
  const { name, phone, password, existingServices, newService } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if phone number exists in vendors
    const vendorExist = await client.query('SELECT * FROM vendors WHERE phone = $1', [phone]);
    if (vendorExist.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Vendor with this phone number already exists' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert vendor
    const newVendorRes = await client.query(
      'INSERT INTO vendors (name, phone, password, status) VALUES ($1, $2, $3, $4) RETURNING id, name, phone, status',
      [name, phone, passwordHash, 'Pending']
    );
    const vendor = newVendorRes.rows[0];

    // Link existing services if selected
    if (Array.isArray(existingServices) && existingServices.length > 0) {
      for (const serviceId of existingServices) {
        await client.query(
          'INSERT INTO vendor_services (vendor_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [vendor.id, serviceId]
        );
      }
    }

    // Create and link custom service if provided
    if (newService && newService.title && newService.subtitle && newService.price !== undefined) {
      const { title, subtitle, price, icon } = newService;
      // Add custom service to DB (default status is Active so users see it)
      const serviceRes = await client.query(
        "INSERT INTO services (title, subtitle, price, icon, status) VALUES ($1, $2, $3, $4, 'Active') RETURNING id",
        [title, subtitle, price, icon || 'construct-outline']
      );
      const newServiceId = serviceRes.rows[0].id;

      // Link to vendor
      await client.query(
        'INSERT INTO vendor_services (vendor_id, service_id) VALUES ($1, $2)',
        [vendor.id, newServiceId]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Registration successful. Awaiting administrator approval.',
      vendor: {
        id: vendor.id,
        name: vendor.name,
        phone: vendor.phone,
        status: vendor.status
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during vendor registration:', error);
    res.status(500).json({ message: 'Server error during vendor registration' });
  } finally {
    client.release();
  }
};

const vendorLogin = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const result = await pool.query('SELECT * FROM vendors WHERE phone = $1', [phone]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Vendor does not exist. Please register to login.' });
    }

    const vendor = result.rows[0];

    const isMatch = bcrypt.compareSync(password, vendor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Password is incorrect.' });
    }

    if (vendor.status === 'Pending') {
      return res.status(403).json({ message: 'Your registration is pending administrator approval.' });
    }

    if (vendor.status === 'Rejected') {
      return res.status(403).json({ message: 'Your registration request was rejected by the administrator.' });
    }

    if (vendor.status === 'Deactivated') {
      return res.status(403).json({ message: 'Your account has been deactivated by the administrator. Please contact support.' });
    }

    const token = jwt.sign(
      { id: vendor.id, phone: vendor.phone, name: vendor.name, isVendor: true },
      process.env.JWT_SECRET || 'nextgen_jwt_secret_key_12345',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      vendor: {
        id: vendor.id,
        name: vendor.name,
        phone: vendor.phone,
        status: vendor.status
      }
    });

  } catch (error) {
    console.error('Error during vendor login:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const parseBookingDate = (dateStr) => {
  if (!dateStr) return null;
  const cleanStr = dateStr.split('(')[0].trim();
  let d = new Date(cleanStr);
  if (isNaN(d.getTime())) {
    const currentYear = new Date().getFullYear();
    d = new Date(`${cleanStr} ${currentYear}`);
  }
  return d;
};

const isToday = (d) => {
  if (!d) return false;
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

const isThisWeek = (d) => {
  if (!d) return false;
  const today = new Date();
  const startOfWeek = new Date(today);
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0,0,0,0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23,59,59,999);
  
  return d >= startOfWeek && d <= endOfWeek;
};

const isThisMonth = (d) => {
  if (!d) return false;
  const today = new Date();
  return d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
};

const isThisYear = (d) => {
  if (!d) return false;
  const today = new Date();
  return d.getFullYear() === today.getFullYear();
};

const getVendorMe = async (req, res) => {
  const vendorId = req.vendor.id;

  try {
    // 1. Fetch vendor profile
    const vendorRes = await pool.query('SELECT id, name, phone, status, created_at FROM vendors WHERE id = $1', [vendorId]);
    if (vendorRes.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    const vendor = vendorRes.rows[0];

    // 2. Fetch linked services
    const servicesRes = await pool.query(`
      SELECT s.* 
      FROM services s 
      JOIN vendor_services vs ON s.id = vs.service_id 
      WHERE vs.vendor_id = $1
      ORDER BY s.id ASC
    `, [vendorId]);

    // 3. Fetch assigned bookings (tasks)
    const bookingsRes = await pool.query(`
      SELECT b.id, b.service_name AS "serviceName", b.date, b.price, b.status, b.icon, b.address, b.created_at,
             u.name AS "userName", u.phone AS "userPhone"
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.vendor_id = $1
      ORDER BY b.created_at DESC, b.id DESC
    `, [vendorId]);

    // 4. Compute stats dynamically
    const allStats = {
      today: { assigned: 0, completed: 0, revenue: 0 },
      week: { assigned: 0, completed: 0, revenue: 0 },
      month: { assigned: 0, completed: 0, revenue: 0 },
      year: { assigned: 0, completed: 0, revenue: 0 },
      total: { assigned: 0, completed: 0, revenue: 0 }
    };

    for (const b of bookingsRes.rows) {
      const bDate = parseBookingDate(b.date);
      const price = parseFloat(b.price || 0);

      // Total
      if (b.status === 'Assigned') allStats.total.assigned++;
      if (b.status === 'Completed') {
        allStats.total.completed++;
        allStats.total.revenue += price;
      }

      // Today
      if (isToday(bDate)) {
        if (b.status === 'Assigned') allStats.today.assigned++;
        if (b.status === 'Completed') {
          allStats.today.completed++;
          allStats.today.revenue += price;
        }
      }

      // Week
      if (isThisWeek(bDate)) {
        if (b.status === 'Assigned') allStats.week.assigned++;
        if (b.status === 'Completed') {
          allStats.week.completed++;
          allStats.week.revenue += price;
        }
      }

      // Month
      if (isThisMonth(bDate)) {
        if (b.status === 'Assigned') allStats.month.assigned++;
        if (b.status === 'Completed') {
          allStats.month.completed++;
          allStats.month.revenue += price;
        }
      }

      // Year
      if (isThisYear(bDate)) {
        if (b.status === 'Assigned') allStats.year.assigned++;
        if (b.status === 'Completed') {
          allStats.year.completed++;
          allStats.year.revenue += price;
        }
      }
    }

    res.json({
      profile: vendor,
      stats: allStats.today,
      allStats: allStats,
      services: servicesRes.rows,
      bookings: bookingsRes.rows
    });

  } catch (error) {
    console.error('Error fetching vendor me data:', error);
    res.status(500).json({ message: 'Server error fetching profile details' });
  }
};

const completeTask = async (req, res) => {
  const taskId = req.params.id;
  const vendorId = req.vendor.id;
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ message: 'Verification OTP is required to complete this task' });
  }

  try {
    // Check if task is assigned to this vendor
    const bookingCheck = await pool.query('SELECT * FROM bookings WHERE id = $1 AND vendor_id = $2', [taskId, vendorId]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Task not found or not assigned to you' });
    }

    const booking = bookingCheck.rows[0];

    // OTP validation
    if (booking.otp !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Incorrect 4-digit verification OTP' });
    }

    // Date validation: "vendor cannot complete the task prior date of booking date"
    try {
      const datePart = booking.date.split('(')[0].trim();
      let scheduledDate = new Date(datePart);
      
      // If year is missing (often defaults to 2001 or is otherwise prior to current year)
      if (!isNaN(scheduledDate.getTime()) && scheduledDate.getFullYear() <= 2010) {
        const currentYear = new Date().getFullYear();
        let withYear = new Date(`${datePart} ${currentYear}`);
        const now = new Date();
        // Year rollover handling: e.g. booking is Jan 2 but current time is Dec 30
        if (withYear < now && now.getMonth() === 11 && withYear.getMonth() === 0) {
          withYear = new Date(`${datePart} ${currentYear + 1}`);
        }
        scheduledDate = withYear;
      }
      
      scheduledDate.setHours(0, 0, 0, 0);

      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);

      if (currentDate < scheduledDate) {
        return res.status(400).json({ 
          message: `Cannot mark task as completed prior to the scheduled booking date: ${datePart}` 
        });
      }
    } catch (dateErr) {
      console.warn('Date parsing warning:', dateErr.message);
    }

    const updated = await pool.query(
      "UPDATE bookings SET status = 'Completed' WHERE id = $1 AND vendor_id = $2 RETURNING *",
      [taskId, vendorId]
    );

    res.json({
      success: true,
      message: 'Task marked as completed',
      booking: updated.rows[0]
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ message: 'Server error completing task' });
  }
};

const addVendorService = async (req, res) => {
  const vendorId = req.vendor.id;
  const { serviceId, newService } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (serviceId) {
      // Link existing service
      await client.query(
        'INSERT INTO vendor_services (vendor_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [vendorId, serviceId]
      );
    } else if (newService && newService.title && newService.subtitle && newService.price !== undefined) {
      // Create new service and link
      const { title, subtitle, price, icon } = newService;
      const serviceRes = await client.query(
        "INSERT INTO services (title, subtitle, price, icon, status) VALUES ($1, $2, $3, $4, 'Active') RETURNING id",
        [title, subtitle, price, icon || 'construct-outline']
      );
      const newServiceId = serviceRes.rows[0].id;

      await client.query(
        'INSERT INTO vendor_services (vendor_id, service_id) VALUES ($1, $2)',
        [vendorId, newServiceId]
      );
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid service parameters provided' });
    }

    await client.query('COMMIT');

    // Fetch and return the updated services list
    const servicesRes = await pool.query(`
      SELECT s.* 
      FROM services s 
      JOIN vendor_services vs ON s.id = vs.service_id 
      WHERE vs.vendor_id = $1
      ORDER BY s.id ASC
    `, [vendorId]);

    res.json({
      success: true,
      services: servicesRes.rows
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding vendor service:', error);
    res.status(500).json({ message: 'Server error adding service link' });
  } finally {
    client.release();
  }
};

const changePassword = async (req, res) => {
  const vendorId = req.vendor.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required' });
  }

  try {
    const result = await pool.query('SELECT password FROM vendors WHERE id = $1', [vendorId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    const vendor = result.rows[0];
    const isMatch = bcrypt.compareSync(currentPassword, vendor.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword, salt);

    await pool.query('UPDATE vendors SET password = $1 WHERE id = $2', [passwordHash, vendorId]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing vendor password:', error);
    res.status(500).json({ message: 'Server error updating password' });
  }
};

const getVendorLeaves = async (req, res) => {
  const vendorId = req.vendor.id;
  try {
    const result = await pool.query(
      'SELECT leave_date AS "leaveDate" FROM vendor_leaves WHERE vendor_id = $1 ORDER BY leave_date ASC',
      [vendorId]
    );
    res.json(result.rows.map(row => row.leaveDate));
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ message: 'Server error retrieving leaves' });
  }
};

const addVendorLeave = async (req, res) => {
  const vendorId = req.vendor.id;
  const { leaveDate } = req.body;

  if (!leaveDate || !/^\d{4}-\d{2}-\d{2}$/.test(leaveDate)) {
    return res.status(400).json({ message: 'Please provide a valid leave date in YYYY-MM-DD format' });
  }

  try {
    await pool.query(
      'INSERT INTO vendor_leaves (vendor_id, leave_date) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [vendorId, leaveDate]
    );
    res.json({ success: true, message: 'Leave declared successfully' });
  } catch (error) {
    console.error('Error declaring leave:', error);
    res.status(500).json({ message: 'Server error declaring leave' });
  }
};

const removeVendorLeave = async (req, res) => {
  const vendorId = req.vendor.id;
  const { leaveDate } = req.params;

  if (!leaveDate) {
    return res.status(400).json({ message: 'Leave date is required' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM vendor_leaves WHERE vendor_id = $1 AND leave_date = $2 RETURNING *',
      [vendorId, leaveDate]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Leave declaration not found' });
    }
    res.json({ success: true, message: 'Leave declaration removed successfully' });
  } catch (error) {
    console.error('Error removing leave:', error);
    res.status(500).json({ message: 'Server error removing leave' });
  }
};

const getVendorSettlements = async (req, res) => {
  const vendorId = req.vendor.id;
  try {
    const settlementsRes = await pool.query(
      'SELECT id, amount, status, created_at AS "createdAt", approved_at AS "approvedAt" FROM settlements WHERE vendor_id = $1 ORDER BY created_at DESC',
      [vendorId]
    );

    const balanceRes = await pool.query(
      "SELECT COALESCE(SUM(price), 0)::float AS balance FROM bookings WHERE vendor_id = $1 AND status = 'Completed' AND settlement_id IS NULL",
      [vendorId]
    );

    res.json({
      settlements: settlementsRes.rows,
      unsettledBalance: balanceRes.rows[0].balance
    });
  } catch (error) {
    console.error('Error fetching settlements:', error);
    res.status(500).json({ message: 'Server error retrieving settlements' });
  }
};

const requestVendorSettlement = async (req, res) => {
  const vendorId = req.vendor.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const bookingsRes = await client.query(
      "SELECT id, price FROM bookings WHERE vendor_id = $1 AND status = 'Completed' AND settlement_id IS NULL",
      [vendorId]
    );

    if (bookingsRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'No unsettled completed bookings available' });
    }

    const amount = bookingsRes.rows.reduce((sum, b) => sum + parseFloat(b.price || 0), 0);

    const settlementRes = await client.query(
      'INSERT INTO settlements (vendor_id, amount, status) VALUES ($1, $2, $3) RETURNING id, amount, status, created_at AS "createdAt"',
      [vendorId, amount, 'Pending']
    );
    const settlementId = settlementRes.rows[0].id;

    for (const b of bookingsRes.rows) {
      await client.query(
        'UPDATE bookings SET settlement_id = $1 WHERE id = $2',
        [settlementId, b.id]
      );
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'Settlement requested successfully',
      settlement: settlementRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error requesting settlement:', error);
    res.status(500).json({ message: 'Server error requesting settlement' });
  } finally {
    client.release();
  }
};

module.exports = {
  vendorRegister,
  vendorLogin,
  getVendorMe,
  completeTask,
  addVendorService,
  changePassword,
  getVendorLeaves,
  addVendorLeave,
  removeVendorLeave,
  getVendorSettlements,
  requestVendorSettlement
};
