const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const register = async (req, res) => {
  const { name, phone, password, referralCode } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if phone number exists
    const userExist = await client.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (userExist.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    // Process Referral Code
    let referredById = null;
    if (referralCode) {
      const referrerQuery = await client.query('SELECT id FROM users WHERE referral_code = $1', [referralCode]);
      if (referrerQuery.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Invalid referral code' });
      }
      referredById = referrerQuery.rows[0].id;

      // Calculate reward amount
      const refCountQuery = await client.query('SELECT COUNT(*) FROM users WHERE referred_by = $1', [referredById]);
      const refCount = parseInt(refCountQuery.rows[0].count);
      const reward = Math.max(50, 100 - (refCount * 5));

      // Update referrer wallet
      await client.query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2', [reward, referredById]);
    }

    // Generate unique referral code for new user
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 7; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };
    
    let unique = false;
    let newReferralCode;
    while(!unique) {
      newReferralCode = generateCode();
      const check = await client.query('SELECT id FROM users WHERE referral_code = $1', [newReferralCode]);
      if(check.rows.length === 0) unique = true;
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert user
    const newUser = await client.query(
      'INSERT INTO users (name, phone, password, referral_code, referred_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, phone, referral_code, wallet_balance',
      [name, phone, passwordHash, newReferralCode, referredById]
    );

    await client.query('COMMIT');

    const user = newUser.rows[0];

    // Generate token
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET || 'nextgen_jwt_secret_key_12345',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        referral_code: user.referral_code,
        wallet_balance: user.wallet_balance
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration' });
  } finally {
    client.release();
  }
};

const login = async (req, res) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Find user
    const result = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'User does not exist. Please register to login.' });
    }

    const user = result.rows[0];

    // Check password
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Password is incorrect.' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, phone: user.phone },
      process.env.JWT_SECRET || 'nextgen_jwt_secret_key_12345',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        referral_code: user.referral_code,
        wallet_balance: user.wallet_balance,
        subscription: null
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user details
    const userRes = await pool.query(
      'SELECT id, name, phone, referral_code, wallet_balance FROM users WHERE id = $1',
      [req.user.id]
    );
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRes.rows[0];

    // Fetch subscription details if any
    const subRes = await pool.query(
      `SELECT s.id, s.slot_number, s.plan, s.valid_till, s.event_name as "eventName",
              s.district_id as "districtId", s.mandal_id as "mandalId",
              d.name AS "districtName", m.name AS "mandalName", s.status, s.payment_mode
       FROM subscriptions s
       LEFT JOIN districts d ON s.district_id = d.id
       LEFT JOIN mandals m ON s.mandal_id = m.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [userId]
    );

    const subscription = subRes.rows.length > 0 ? {
      id: subRes.rows[0].id,
      slotNumber: subRes.rows[0].slot_number,
      plan: subRes.rows[0].plan,
      validTill: subRes.rows[0].valid_till,
      eventName: subRes.rows[0].eventName,
      districtId: subRes.rows[0].districtId,
      mandalId: subRes.rows[0].mandalId,
      districtName: subRes.rows[0].districtName,
      mandalName: subRes.rows[0].mandalName,
      status: subRes.rows[0].status,
      paymentMode: subRes.rows[0].payment_mode
    } : null;

    res.json({
      ...user,
      subscription
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
};

const updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  const userId = req.user.id;

  if (!name || !phone) {
    return res.status(400).json({ message: 'Please enter name and phone number' });
  }

  try {
    // Check if phone number is taken by another user
    const phoneCheck = await pool.query('SELECT * FROM users WHERE phone = $1 AND id != $2', [phone, userId]);
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Phone number already taken' });
    }

    // Update user
    const updatedUser = await pool.query(
      'UPDATE users SET name = $1, phone = $2 WHERE id = $3 RETURNING id, name, phone',
      [name, phone, userId]
    );

    res.json(updatedUser.rows[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

const changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required' });
  }

  try {
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(newPassword, salt);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [passwordHash, userId]);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing customer password:', error);
    res.status(500).json({ message: 'Server error updating password' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
};
