const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { Service, Notification } = require('../models/dbModel');

const parseSlotsRange = (slotsStr) => {
  if (!slotsStr) return '';
  const parts = slotsStr.split(',');
  const expanded = [];
  
  for (let part of parts) {
    part = part.trim();
    if (part.includes('-')) {
      const rangeParts = part.split('-');
      if (rangeParts.length === 2) {
        const start = parseInt(rangeParts[0].trim(), 10);
        const end = parseInt(rangeParts[1].trim(), 10);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            expanded.push(String(i));
          }
          continue;
        }
      }
    }
    if (part) expanded.push(part);
  }
  
  return expanded.join(', ');
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const adminRes = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (adminRes.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const admin = adminRes.rows[0];

    const isMatch = bcrypt.compareSync(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name, isAdmin: true },
      process.env.JWT_SECRET || 'nextgen_jwt_secret_key_12345',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name
      }
    });

  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
};

const getAdminMe = async (req, res) => {
  try {
    const adminId = req.admin.id;
    const adminRes = await pool.query('SELECT id, email, name, created_at FROM admins WHERE id = $1', [adminId]);
    if (adminRes.rows.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(adminRes.rows[0]);
  } catch (error) {
    console.error('Error fetching admin profile:', error);
    res.status(500).json({ message: 'Server error fetching admin profile' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // 1. Total Users
    const usersCountRes = await pool.query('SELECT COUNT(*) FROM users');
    const usersCount = parseInt(usersCountRes.rows[0].count);

    // 2. Total Subscribers
    const subCountRes = await pool.query('SELECT COUNT(*) FROM subscriptions');
    const subscribersCount = parseInt(subCountRes.rows[0].count);

    // 3. Total Bookings
    const bookingsCountRes = await pool.query('SELECT COUNT(*) FROM bookings');
    const bookingsCount = parseInt(bookingsCountRes.rows[0].count);

    // 4. Revenue (Sum of subscriptions + paid bookings)
    const subRevenueRes = await pool.query('SELECT COALESCE(SUM(price), 0) AS total FROM subscriptions');
    const subRevenue = parseFloat(subRevenueRes.rows[0].total);

    const bookingRevenueRes = await pool.query(`
      SELECT COALESCE(SUM(price), 0) AS total 
      FROM bookings 
      WHERE status != 'Cancelled' AND price > 0
    `);
    const bookingRevenue = parseFloat(bookingRevenueRes.rows[0].total);

    const totalRevenue = subRevenue + bookingRevenue;

    // 5. Recent Bookings (limit to 3)
    const recentBookingsRes = await pool.query(`
      SELECT 
        b.id, b.service_name AS "serviceName", b.date, b.price, b.status, b.icon, b.address, b.created_at,
        u.name AS "userName", u.phone AS "userPhone"
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC, b.id DESC
      LIMIT 3
    `);

    // 6. Pending Subscription Requests
    const pendingSubscriptionsRes = await pool.query(`
      SELECT s.id, s.plan, s.price, s.created_at, u.name AS "userName", u.phone AS "userPhone"
      FROM subscriptions s JOIN users u ON s.user_id = u.id
      WHERE s.status = 'Pending' ORDER BY s.created_at DESC LIMIT 3
    `);

    // 7. Pending Vendor Requests
    const pendingVendorsRes = await pool.query(`
      SELECT id, name, phone, created_at
      FROM vendors WHERE status = 'Pending' ORDER BY created_at DESC LIMIT 3
    `);

    // 8. Pending Payment Settlements
    const pendingSettlementsRes = await pool.query(`
      SELECT s.id, s.amount, s.created_at, v.name AS "vendorName", v.phone AS "vendorPhone"
      FROM settlements s JOIN vendors v ON s.vendor_id = v.id
      WHERE s.status = 'Pending' ORDER BY s.created_at DESC LIMIT 3
    `);

    // 9. Pending Referral Withdrawals
    const pendingWithdrawalsRes = await pool.query(`
      SELECT w.id, w.amount, w.created_at, u.name AS "userName", u.phone AS "userPhone"
      FROM withdrawals w JOIN users u ON w.user_id = u.id
      WHERE w.status = 'Pending' ORDER BY w.created_at DESC LIMIT 3
    `);

    res.json({
      stats: {
        users: usersCount,
        subscribers: subscribersCount,
        bookings: bookingsCount,
        revenue: totalRevenue,
        subscriptionRevenue: subRevenue,
        bookingRevenue: bookingRevenue
      },
      recentBookings: recentBookingsRes.rows,
      pendingSubscriptions: pendingSubscriptionsRes.rows,
      pendingVendors: pendingVendorsRes.rows,
      pendingSettlements: pendingSettlementsRes.rows,
      pendingWithdrawals: pendingWithdrawalsRes.rows
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error fetching dashboard statistics' });
  }
};

const getUsers = async (req, res) => {
  const search = req.query.search || '';
  const searchPattern = `%${search}%`;

  try {
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.phone, 
        u.created_at AS "createdAt", 
        COUNT(DISTINCT b.id)::int AS "bookingCount",
        (MAX(s.slot_number) IS NOT NULL) AS "isSubscribed",
        MAX(s.slot_number) AS "slotNumber",
        MAX(s.status) AS "subscriptionStatus",
        MAX(s.id) AS "subscriptionId"
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status != 'Rejected'
      WHERE u.name ILIKE $1 OR u.phone ILIKE $1
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `, [searchPattern]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ message: 'Server error retrieving users list' });
  }
};

const getUserReferrals = async (req, res) => {
  const userId = req.params.id;

  try {
    // Get direct referrals
    const directReferralsRes = await pool.query('SELECT name, created_at FROM users WHERE referred_by = $1 ORDER BY created_at ASC', [userId]);
    const referralRewards = [200, 230, 260, 290, 320, 350, 380, 410, 450, 500];
    
    const directReferrals = directReferralsRes.rows.map((ref, index) => {
      const amount = index < referralRewards.length ? referralRewards[index] : 500;
      return { ...ref, type: 'Direct', amount };
    });

    // Get indirect (sub) referrals
    const indirectReferralsRes = await pool.query(`
      SELECT u2.name, u2.created_at 
      FROM users u1
      JOIN users u2 ON u2.referred_by = u1.id
      WHERE u1.referred_by = $1
      ORDER BY u2.created_at ASC
    `, [userId]);

    const indirectReferrals = indirectReferralsRes.rows.map(ref => ({
      ...ref, type: 'Indirect', amount: 100
    }));

    // Combine and sort by date descending
    const referrals = [...directReferrals, ...indirectReferrals].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(referrals);
  } catch (error) {
    console.error('Error getting user referrals:', error);
    res.status(500).json({ message: 'Server error retrieving user referrals' });
  }
};

const getSubscribers = async (req, res) => {
  const search = req.query.search || '';
  const searchPattern = `%${search}%`;

  try {
    const result = await pool.query(`
      SELECT 
        s.id AS "subId",
        s.slot_number AS "slotNumber",
        s.plan,
        s.price,
        s.valid_till AS "validTill",
        s.created_at AS "subscribedAt",
        s.status,
        s.payment_mode AS "paymentMode",
        s.transaction_id AS "transactionId",
        s.screenshot_url AS "screenshotUrl",
        u.id AS "userId",
        u.name,
        u.phone,
        d.name AS "districtName",
        m.name AS "mandalName",
        s.event_name AS "eventName"
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN districts d ON s.district_id = d.id
      LEFT JOIN mandals m ON s.mandal_id = m.id
      WHERE s.status = 'Active' AND (
        u.name ILIKE $1 OR 
        u.phone ILIKE $1 OR 
        CAST(s.slot_number AS VARCHAR) ILIKE $1 OR 
        d.name ILIKE $1 OR 
        m.name ILIKE $1 OR
        CAST(s.id AS VARCHAR) ILIKE $1 OR
        CAST(u.id AS VARCHAR) ILIKE $1
      )
      ORDER BY s.created_at DESC
    `, [searchPattern]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error listing subscribers:', error);
    res.status(500).json({ message: 'Server error retrieving subscribers list' });
  }
};

const getBookings = async (req, res) => {
  const status = req.query.status || 'All'; // 'Booked', 'Completed', 'All'
  const search = req.query.search || '';
  const searchPattern = `%${search}%`;

  try {
    let query = `
      SELECT 
        b.id,
        b.service_name AS "serviceName",
        b.date,
        b.price,
        b.status,
        b.icon,
        b.address,
        b.created_at AS "createdAt",
        u.name AS "userName",
        u.phone AS "userPhone",
        b.vendor_id AS "vendorId",
        v.name AS "vendorName",
        d.name AS "districtName",
        m.name AS "mandalName",
        b.event_name AS "eventName",
        b.slot_number AS "slotNumber"
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN vendors v ON b.vendor_id = v.id
      LEFT JOIN districts d ON b.district_id = d.id
      LEFT JOIN mandals m ON b.mandal_id = m.id
      WHERE (b.status = $1 OR $1 = 'All')
        AND (u.name ILIKE $2 OR u.phone ILIKE $2 OR b.service_name ILIKE $2 OR b.id ILIKE $2 OR d.name ILIKE $2 OR m.name ILIKE $2)
      ORDER BY b.created_at DESC, b.id DESC
    `;

    const result = await pool.query(query, [status, searchPattern]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error listing bookings:', error);
    res.status(500).json({ message: 'Server error retrieving bookings list' });
  }
};

const completeBooking = async (req, res) => {
  const bookingId = req.params.id;

  try {
    const updated = await pool.query(
      "UPDATE bookings SET status = 'Completed' WHERE id = $1 RETURNING *",
      [bookingId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    try {
      await Notification.create(
        updated.rows[0].user_id,
        'Task Completed',
        `Your booking for ${updated.rows[0].service_name} has been marked as completed by the admin.`,
        'task'
      );
    } catch (err) {
      console.error('Failed to create notification', err);
    }

    res.json({
      success: true,
      message: 'Booking marked as completed',
      booking: updated.rows[0]
    });

  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({ message: 'Server error marking booking as completed' });
  }
};

const cancelBooking = async (req, res) => {
  const bookingId = req.params.id;

  try {
    const deleted = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING *', [bookingId]);
    
    if (deleted.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ message: 'Server error deleting booking' });
  }
};

const adminGetServices = async (req, res) => {
  try {
    const services = await Service.getAll();
    res.json(services);
  } catch (error) {
    console.error('Error fetching services for admin:', error);
    res.status(500).json({ message: 'Server error fetching services' });
  }
};

const adminAddService = async (req, res) => {
  const { title, subtitle, price, icon } = req.body;

  if (!title || !subtitle || price === undefined) {
    return res.status(400).json({ message: 'Please provide title, subtitle, and price' });
  }

  try {
    const newService = await Service.create(title, subtitle, price, icon);
    res.status(201).json(newService);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Server error creating service' });
  }
};

const adminUpdateService = async (req, res) => {
  const { id } = req.params;
  const { title, subtitle, price, icon, status } = req.body;

  if (!title || !subtitle || price === undefined || !status) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    const updatedService = await Service.update(id, title, subtitle, price, icon, status);
    if (!updatedService) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Server error updating service' });
  }
};

const adminDeleteService = async (req, res) => {
  const { id } = req.params;

  try {
    const success = await Service.delete(id);
    if (!success) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Server error deleting service' });
  }
};

const getVendors = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.id, 
        v.name, 
        v.phone, 
        v.status, 
        v.created_at AS "createdAt",
        v.district_id AS "districtId",
        v.mandal_id AS "mandalId",
        d.name AS "districtName",
        m.name AS "mandalName",
        (
          SELECT COALESCE(ARRAY_AGG(s.title), '{}')
          FROM vendor_services vs
          JOIN services s ON vs.service_id = s.id
          WHERE vs.vendor_id = v.id
        ) AS services,
        COALESCE(b_stats.assigned_count, 0)::int AS "assignedCount",
        COALESCE(b_stats.completed_count, 0)::int AS "completedCount",
        COALESCE(b_stats.total_earnings, 0)::float AS "totalEarnings"
      FROM vendors v
      LEFT JOIN districts d ON v.district_id = d.id
      LEFT JOIN mandals m ON v.mandal_id = m.id
      LEFT JOIN (
        SELECT 
          vendor_id,
          COUNT(CASE WHEN status = 'Assigned' THEN 1 END) AS assigned_count,
          COUNT(CASE WHEN status = 'Completed' THEN 1 END) AS completed_count,
          SUM(CASE WHEN status = 'Completed' THEN price END) AS total_earnings
        FROM bookings
        GROUP BY vendor_id
      ) b_stats ON v.id = b_stats.vendor_id
      GROUP BY v.id, d.name, m.name, b_stats.assigned_count, b_stats.completed_count, b_stats.total_earnings
      ORDER BY v.created_at DESC
    `);

    const vendors = [];
    for (let vendor of result.rows) {
      const tasksRes = await pool.query(`
        SELECT b.id, b.service_name AS "serviceName", b.date, b.price, b.status, b.address,
               u.name AS "userName", u.phone AS "userPhone"
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.vendor_id = $1
        ORDER BY b.created_at DESC
      `, [vendor.id]);
      vendors.push({
        ...vendor,
        tasks: tasksRes.rows
      });
    }

    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors list for admin:', error);
    res.status(500).json({ message: 'Server error retrieving vendors list' });
  }
};

const approveVendor = async (req, res) => {
  const vendorId = req.params.id;

  try {
    const result = await pool.query(
      "UPDATE vendors SET status = 'Approved' WHERE id = $1 RETURNING id, name, phone, status",
      [vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({
      success: true,
      message: 'Vendor approved successfully',
      vendor: result.rows[0]
    });
  } catch (error) {
    console.error('Error approving vendor:', error);
    res.status(500).json({ message: 'Server error approving vendor' });
  }
};

const rejectVendor = async (req, res) => {
  const vendorId = req.params.id;

  try {
    const result = await pool.query(
      "UPDATE vendors SET status = 'Rejected' WHERE id = $1 RETURNING id, name, phone, status",
      [vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({
      success: true,
      message: 'Vendor rejected successfully',
      vendor: result.rows[0]
    });
  } catch (error) {
    console.error('Error rejecting vendor:', error);
    res.status(500).json({ message: 'Server error rejecting vendor' });
  }
};

const deactivateVendor = async (req, res) => {
  const vendorId = req.params.id;

  try {
    const result = await pool.query(
      "UPDATE vendors SET status = 'Deactivated' WHERE id = $1 RETURNING id, name, phone, status",
      [vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({
      success: true,
      message: 'Vendor deactivated successfully',
      vendor: result.rows[0]
    });
  } catch (error) {
    console.error('Error deactivating vendor:', error);
    res.status(500).json({ message: 'Server error deactivating vendor' });
  }
};

const reactivateVendor = async (req, res) => {
  const vendorId = req.params.id;

  try {
    const result = await pool.query(
      "UPDATE vendors SET status = 'Approved' WHERE id = $1 RETURNING id, name, phone, status",
      [vendorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json({
      success: true,
      message: 'Vendor reactivated successfully',
      vendor: result.rows[0]
    });
  } catch (error) {
    console.error('Error reactivating vendor:', error);
    res.status(500).json({ message: 'Server error reactivating vendor' });
  }
};

const getSettlements = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id,
        s.amount,
        s.status,
        s.created_at AS "createdAt",
        s.approved_at AS "approvedAt",
        v.name AS "vendorName",
        v.phone AS "vendorPhone"
      FROM settlements s
      JOIN vendors v ON s.vendor_id = v.id
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching settlements for admin:', error);
    res.status(500).json({ message: 'Server error retrieving settlements list' });
  }
};

const approveSettlement = async (req, res) => {
  const settlementId = req.params.id;
  try {
    const result = await pool.query(
      "UPDATE settlements SET status = 'Approved', approved_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [settlementId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Settlement request not found' });
    }
    res.json({ success: true, message: 'Settlement approved successfully', settlement: result.rows[0] });
  } catch (error) {
    console.error('Error approving settlement:', error);
    res.status(500).json({ message: 'Server error approving settlement' });
  }
};

const rejectSettlement = async (req, res) => {
  const settlementId = req.params.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      "UPDATE settlements SET status = 'Rejected', approved_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [settlementId]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Settlement request not found' });
    }

    await client.query(
      "UPDATE bookings SET settlement_id = NULL WHERE settlement_id = $1",
      [settlementId]
    );

    await client.query('COMMIT');
    res.json({ success: true, message: 'Settlement rejected successfully', settlement: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting settlement:', error);
    res.status(500).json({ message: 'Server error rejecting settlement' });
  } finally {
    client.release();
  }
};

const getEligibleVendorsForBooking = async (req, res) => {
  const bookingId = req.params.id;
  try {
    const bookingRes = await pool.query('SELECT service_name, date FROM bookings WHERE id = $1', [bookingId]);
    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    const booking = bookingRes.rows[0];

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

    const leaveDateCheck = parseToDateString(booking.date);

    const vendorsRes = await pool.query(`
      SELECT 
        v.id, 
        v.name, 
        v.phone, 
        v.status,
        COUNT(CASE WHEN b.status = 'Assigned' THEN 1 END)::int AS "activeWorkload",
        COALESCE(SUM(CASE WHEN b.status = 'Completed' THEN b.price ELSE 0 END), 0)::float AS "totalEarnings"
      FROM vendors v
      JOIN vendor_services vs ON v.id = vs.vendor_id
      JOIN services s ON vs.service_id = s.id
      LEFT JOIN bookings b ON v.id = b.vendor_id
      WHERE LOWER(s.title) = LOWER($1) 
        AND v.status = 'Approved'
        AND v.id NOT IN (
          SELECT vendor_id FROM vendor_leaves WHERE leave_date = $2
        )
      GROUP BY v.id
      ORDER BY "activeWorkload" ASC, "totalEarnings" ASC, v.name ASC
    `, [booking.service_name.trim(), leaveDateCheck]);

    res.json(vendorsRes.rows);
  } catch (error) {
    console.error('Error fetching eligible vendors:', error);
    res.status(500).json({ message: 'Server error retrieving eligible vendors' });
  }
};

const reassignBookingVendor = async (req, res) => {
  const bookingId = req.params.id;
  const { vendorId } = req.body;

  try {
    if (vendorId) {
      const vendorCheck = await pool.query("SELECT * FROM vendors WHERE id = $1 AND status = 'Approved'", [vendorId]);
      if (vendorCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Vendor must be an approved registered technician' });
      }
    }

    const updated = await pool.query(
      `UPDATE bookings 
       SET vendor_id = $1::integer, status = CASE WHEN $1::integer IS NULL THEN 'Booked' ELSE 'Assigned' END 
       WHERE id = $2 RETURNING *`,
      [vendorId || null, bookingId]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (vendorId) {
      try {
        await Notification.create(
          updated.rows[0].user_id,
          'Technician Assigned',
          `A technician has been assigned to your booking for ${updated.rows[0].service_name}.`,
          'vendor'
        );
      } catch (err) {
        console.error('Failed to create notification', err);
      }
    }

    res.json({
      success: true,
      message: 'Vendor reassigned successfully',
      booking: updated.rows[0]
    });
  } catch (error) {
    console.error('Error reassigning vendor:', error);
    res.status(500).json({ message: 'Server error reassigning vendor to booking' });
  }
};

// districts CRUD handlers
const adminGetDistricts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM districts ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting districts:', error);
    res.status(500).json({ message: 'Server error retrieving districts' });
  }
};

const adminAddDistrict = async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Please enter a district name' });
  }
  try {
    const check = await pool.query('SELECT * FROM districts WHERE LOWER(name) = LOWER($1)', [name]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'District already exists' });
    }
    const result = await pool.query('INSERT INTO districts (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding district:', error);
    res.status(500).json({ message: 'Server error adding district' });
  }
};

const adminUpdateDistrict = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Please enter a district name' });
  }
  try {
    const check = await pool.query('SELECT * FROM districts WHERE LOWER(name) = LOWER($1) AND id != $2', [name, id]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Another district with this name already exists' });
    }
    const result = await pool.query('UPDATE districts SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'District not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating district:', error);
    res.status(500).json({ message: 'Server error updating district' });
  }
};

const adminDeleteDistrict = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM districts WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'District not found' });
    }
    res.json({ success: true, message: 'District deleted successfully' });
  } catch (error) {
    console.error('Error deleting district:', error);
    res.status(500).json({ message: 'Server error deleting district' });
  }
};

// mandals CRUD handlers
const adminGetMandals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, d.name as "districtName" 
      FROM mandals m
      JOIN districts d ON m.district_id = d.id
      ORDER BY d.name ASC, m.name ASC
    `);
    
    const mandals = [];
    for (let m of result.rows) {
      const eventsRes = await pool.query('SELECT * FROM events WHERE mandal_id = $1 ORDER BY event_name ASC', [m.id]);
      mandals.push({
        ...m,
        events: eventsRes.rows
      });
    }
    res.json(mandals);
  } catch (error) {
    console.error('Error getting mandals:', error);
    res.status(500).json({ message: 'Server error retrieving mandals' });
  }
};

const adminAddMandal = async (req, res) => {
  const { district_id, name } = req.body;
  if (!district_id || !name) {
    return res.status(400).json({ message: 'Please enter district and mandal name' });
  }
  try {
    const check = await pool.query('SELECT * FROM mandals WHERE LOWER(name) = LOWER($1) AND district_id = $2', [name, district_id]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Mandal already exists in this district' });
    }
    const result = await pool.query(
      `INSERT INTO mandals (district_id, name) VALUES ($1, $2) RETURNING *`,
      [district_id, name]
    );
    const createdMandal = result.rows[0];
    const dNameRes = await pool.query('SELECT name FROM districts WHERE id = $1', [district_id]);
    createdMandal.districtName = dNameRes.rows[0].name;
    createdMandal.events = [];
    res.status(201).json(createdMandal);
  } catch (error) {
    console.error('Error adding mandal:', error);
    res.status(500).json({ message: 'Server error adding mandal' });
  }
};

const adminUpdateMandal = async (req, res) => {
  const { id } = req.params;
  const { district_id, name } = req.body;
  if (!district_id || !name) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }
  try {
    const check = await pool.query('SELECT * FROM mandals WHERE LOWER(name) = LOWER($1) AND district_id = $2 AND id != $3', [name, district_id, id]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Another mandal with this name already exists in this district' });
    }
    const result = await pool.query(
      `UPDATE mandals SET district_id = $1, name = $2 WHERE id = $3 RETURNING *`,
      [district_id, name, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Mandal not found' });
    }
    const updatedMandal = result.rows[0];
    const dNameRes = await pool.query('SELECT name FROM districts WHERE id = $1', [district_id]);
    updatedMandal.districtName = dNameRes.rows[0].name;
    
    const eventsRes = await pool.query('SELECT * FROM events WHERE mandal_id = $1 ORDER BY event_name ASC', [updatedMandal.id]);
    updatedMandal.events = eventsRes.rows;

    res.json(updatedMandal);
  } catch (error) {
    console.error('Error updating mandal:', error);
    res.status(500).json({ message: 'Server error updating mandal' });
  }
};

const adminDeleteMandal = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM mandals WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Mandal not found' });
    }
    res.json({ success: true, message: 'Mandal deleted successfully' });
  } catch (error) {
    console.error('Error deleting mandal:', error);
    res.status(500).json({ message: 'Server error deleting mandal' });
  }
};

// Events CRUD Handlers
const adminAddEvent = async (req, res) => {
  const { mandal_id, event_name, description, slots, price, included_services, thumbnail } = req.body;
  if (!mandal_id || !event_name || !slots || price === undefined) {
    return res.status(400).json({ message: 'Please enter all required event fields' });
  }
  try {
    const check = await pool.query('SELECT * FROM events WHERE LOWER(event_name) = LOWER($1) AND mandal_id = $2', [event_name, mandal_id]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Event already exists in this mandal' });
    }
    const expandedSlots = parseSlotsRange(slots);
    
    const result = await pool.query(
      `INSERT INTO events (mandal_id, event_name, description, slots, price, included_services, thumbnail) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [mandal_id, event_name, description || '', expandedSlots, parseFloat(price), included_services ? JSON.stringify(included_services) : null, thumbnail || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ message: 'Server error adding event' });
  }
};

const adminUpdateEvent = async (req, res) => {
  const { id } = req.params;
  const { event_name, description, slots, price, included_services, thumbnail } = req.body;
  if (!event_name || !slots || price === undefined) {
    return res.status(400).json({ message: 'Please enter all required event fields' });
  }
  try {
    // Check if another event in the same mandal has this name
    const currentEventRes = await pool.query('SELECT mandal_id FROM events WHERE id = $1', [id]);
    if(currentEventRes.rows.length === 0) return res.status(404).json({ message: 'Event not found' });
    const mandal_id = currentEventRes.rows[0].mandal_id;

    const check = await pool.query('SELECT * FROM events WHERE LOWER(event_name) = LOWER($1) AND mandal_id = $2 AND id != $3', [event_name, mandal_id, id]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Another event with this name already exists in this mandal' });
    }

    const expandedSlots = parseSlotsRange(slots);

    const result = await pool.query(
      `UPDATE events SET event_name = $1, description = $2, slots = $3, price = $4, included_services = $5, thumbnail = $6 WHERE id = $7 RETURNING *`,
      [event_name, description || '', expandedSlots, parseFloat(price), included_services ? JSON.stringify(included_services) : null, thumbnail || null, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error updating event' });
  }
};

const adminDeleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error deleting event' });
  }
};

const getSubscriptionRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id AS "subId",
        s.slot_number AS "slotNumber",
        s.plan,
        s.price,
        s.valid_till AS "validTill",
        s.created_at AS "subscribedAt",
        s.status,
        s.payment_mode AS "paymentMode",
        s.transaction_id AS "transactionId",
        s.screenshot_url AS "screenshotUrl",
        u.id AS "userId",
        u.name,
        u.phone,
        d.name AS "districtName",
        m.name AS "mandalName",
        s.event_name AS "eventName"
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN districts d ON s.district_id = d.id
      LEFT JOIN mandals m ON s.mandal_id = m.id
      WHERE s.status = 'Pending'
      ORDER BY s.created_at ASC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting subscription requests:', error);
    res.status(500).json({ message: 'Server error retrieving requests' });
  }
};

const getSubscriptionHistory = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.id as "subId",
        s.plan,
        s.price,
        s.payment_mode as "paymentMode",
        s.transaction_id as "transactionId",
        s.screenshot_url as "screenshotUrl",
        s.status,
        s.remark,
        s.created_at as "createdAt",
        s.slot_number as "slotNumber",
        u.name,
        u.phone,
        d.name as "districtName",
        m.name as "mandalName",
        s.event_name as "eventName"
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN districts d ON s.district_id = d.id
      LEFT JOIN mandals m ON s.mandal_id = m.id
      WHERE s.status IN ('Active', 'Rejected')
      ORDER BY s.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting subscription history:', error);
    res.status(500).json({ message: 'Server error retrieving subscription history' });
  }
};

const approveSubscription = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("UPDATE subscriptions SET status = 'Active' WHERE id = $1 RETURNING *", [id]);
    if(result.rows.length === 0) return res.status(404).json({ message: 'Subscription not found' });
    
    const sub = result.rows[0];

    // REFERRAL REWARD LOGIC
    // Check if the user who just subscribed was referred by someone and hasn't triggered a reward yet
    const userQuery = await pool.query('SELECT referred_by, referral_paid FROM users WHERE id = $1', [sub.user_id]);
    if (userQuery.rows.length > 0) {
      const user = userQuery.rows[0];
      
      if (user.referred_by && !user.referral_paid) {
        const referredById = user.referred_by;
        
        // Find indirect referrer
        const referrerQuery = await pool.query('SELECT referred_by FROM users WHERE id = $1', [referredById]);
        const indirectReferrerId = referrerQuery.rows.length > 0 ? referrerQuery.rows[0].referred_by : null;

        // Calculate reward amount based on the number of PREVIOUSLY PAID referrals
        const refCountQuery = await pool.query('SELECT COUNT(*) FROM users WHERE referred_by = $1 AND referral_paid = TRUE', [referredById]);
        const refCount = parseInt(refCountQuery.rows[0].count);
        
        const referralRewards = [200, 230, 260, 290, 320, 350, 380, 410, 450, 500];
        const reward = refCount < referralRewards.length ? referralRewards[refCount] : 500;

        // Update direct referrer wallet
        await pool.query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [reward, referredById]);
        
        // Update indirect referrer wallet (if exists) with second-level ₹100 bonus
        if (indirectReferrerId) {
          await pool.query('UPDATE users SET wallet_balance = wallet_balance + 100 WHERE id = $1', [indirectReferrerId]);
        }

        // Mark this user as having paid out their referral bonus
        await pool.query('UPDATE users SET referral_paid = TRUE WHERE id = $1', [sub.user_id]);
      }
    }

    try {
      await Notification.create(
        sub.user_id,
        'Subscription Approved',
        `Your subscription request for ${sub.plan} has been approved and is now active.`,
        'subscription'
      );
    } catch (err) {
      console.error('Failed to create notification', err);
    }

    res.json({ success: true, message: 'Subscription approved and rewards processed if applicable', subscription: sub });
  } catch (error) {
    console.error('Error approving subscription:', error);
    res.status(500).json({ message: 'Server error approving subscription' });
  }
};

const rejectSubscription = async (req, res) => {
  const subId = req.params.id;
  const { remark } = req.body;
  try {
    const updated = await pool.query(
      "UPDATE subscriptions SET status = 'Rejected', slot_number = slot_number || '-REJECTED-' || id, remark = $2 WHERE id = $1 RETURNING *",
      [subId, remark || '']
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ message: 'Subscription request not found' });
    }

    try {
      await Notification.create(
        updated.rows[0].user_id,
        'Subscription Rejected',
        `Your subscription request has been rejected. Remark: ${remark || 'None'}`,
        'subscription'
      );
    } catch (err) {
      console.error('Failed to create notification', err);
    }

    res.json({
      success: true,
      message: 'Subscription rejected',
      subscription: updated.rows[0]
    });
  } catch (error) {
    console.error('Error rejecting subscription:', error);
    res.status(500).json({ message: 'Server error rejecting subscription request' });
  }
};

// Withdrawal Management
const getWithdrawals = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        w.*, 
        u.name as "userName", 
        u.phone as "userPhone",
        u.wallet_balance as "walletBalance",
        u.referral_code as "referralCode",
        (SELECT COUNT(*) FROM users r WHERE r.referred_by = u.id)::int as "referralCount"
      FROM withdrawals w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting withdrawals:', error);
    res.status(500).json({ message: 'Server error retrieving withdrawals' });
  }
};

const updateWithdrawalStatus = async (req, res) => {
  const withdrawId = req.params.id;
  const { status } = req.body; // 'In Progress', 'Paid', 'Rejected'

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Get current withdrawal
    const wRes = await client.query('SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE', [withdrawId]);
    if (wRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Withdrawal not found' });
    }
    const withdrawal = wRes.rows[0];

    // If it was already terminal, don't allow change
    if (withdrawal.status === 'Paid' || withdrawal.status === 'Rejected') {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Withdrawal status is already finalized' });
    }

    // If changing to Rejected, refund wallet
    if (status === 'Rejected') {
      await client.query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [withdrawal.amount, withdrawal.user_id]);
    }

    const updated = await client.query(
      'UPDATE withdrawals SET status = $1 WHERE id = $2 RETURNING *',
      [status, withdrawId]
    );

    await client.query('COMMIT');
    
    try {
      await Notification.create(
        withdrawal.user_id,
        `Withdrawal ${status}`,
        `Your withdrawal request for ₹${withdrawal.amount} has been ${status.toLowerCase()}.`,
        'wallet'
      );
    } catch (err) {
      console.error('Failed to create notification', err);
    }

    res.json({ success: true, message: 'Withdrawal status updated', withdrawal: updated.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating withdrawal:', error);
    res.status(500).json({ message: 'Server error updating withdrawal' });
  } finally {
    client.release();
  }
};

const getPendingNotifications = async (req, res) => {
  try {
    const vendorsRes = await pool.query("SELECT COUNT(*) FROM vendors WHERE status = 'Pending'");
    const settlementsRes = await pool.query("SELECT COUNT(*) FROM settlements WHERE status = 'Pending'");
    const withdrawalsRes = await pool.query("SELECT COUNT(*) FROM withdrawals WHERE status = 'Pending'");
    const subscriptionsRes = await pool.query("SELECT COUNT(*) FROM subscriptions WHERE status = 'Pending'");

    res.json({
      vendors: parseInt(vendorsRes.rows[0].count),
      settlements: parseInt(settlementsRes.rows[0].count),
      withdrawals: parseInt(withdrawalsRes.rows[0].count),
      subscriptions: parseInt(subscriptionsRes.rows[0].count)
    });
  } catch (error) {
    console.error('Error fetching pending notifications:', error);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
};

const getEnquiries = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM enquiries ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    res.status(500).json({ message: 'Server error retrieving enquiries list' });
  }
};

const updateEnquiryStatus = async (req, res) => {
  const enquiryId = req.params.id;
  const { status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE enquiries SET status = $1 WHERE id = $2 RETURNING *',
      [status, enquiryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    res.json({
      success: true,
      message: 'Enquiry status updated successfully',
      enquiry: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating enquiry status:', error);
    res.status(500).json({ message: 'Server error updating enquiry status' });
  }
};

module.exports = {
  adminLogin,
  getAdminMe,
  getDashboardStats,
  getUsers,
  getSubscribers,
  getBookings,
  completeBooking,
  cancelBooking,
  adminGetServices,
  adminAddService,
  adminUpdateService,
  adminDeleteService,
  getVendors,
  approveVendor,
  rejectVendor,
  deactivateVendor,
  reactivateVendor,
  getSettlements,
  approveSettlement,
  rejectSettlement,
  getEligibleVendorsForBooking,
  reassignBookingVendor,
  adminGetDistricts,
  adminAddDistrict,
  adminUpdateDistrict,
  adminDeleteDistrict,
  adminGetMandals,
  adminAddMandal,
  adminUpdateMandal,
  adminDeleteMandal,
  adminAddEvent,
  adminUpdateEvent,
  adminDeleteEvent,
  getSubscriptionRequests,
  getSubscriptionHistory,
  approveSubscription,
  rejectSubscription,
  getWithdrawals,
  updateWithdrawalStatus,
  getUserReferrals,
  getPendingNotifications,
  getEnquiries,
  updateEnquiryStatus
};
