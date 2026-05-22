const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const register = async (req, res) => {
  const { name, phone, password } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    // Check if phone number exists
    const userExist = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (userExist.rows.length > 0) {
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert user
    const newUser = await pool.query(
      'INSERT INTO users (name, phone, password) VALUES ($1, $2, $3) RETURNING id, name, phone',
      [name, phone, passwordHash]
    );

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
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ message: 'Server error during registration' });
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
        phone: user.phone
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
    const userRes = await pool.query('SELECT id, name, phone, created_at FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRes.rows[0];

    // Fetch subscription details if any
    const subRes = await pool.query(
      'SELECT id, slot_number, plan, valid_till FROM subscriptions WHERE user_id = $1',
      [userId]
    );

    const subscription = subRes.rows.length > 0 ? {
      id: subRes.rows[0].id,
      slotNumber: subRes.rows[0].slot_number,
      plan: subRes.rows[0].plan,
      validTill: subRes.rows[0].valid_till
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

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};
