const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { sendOtpEmail } = require('../utils/mailer');

const register = async (req, res) => {
  const { name, phone, password, referralCode, district_id, mandal_id, address, email, otp } = req.body;

  if (!name || !phone || !password || !district_id || !mandal_id || !email || !otp) {
    return res.status(400).json({ message: 'Please enter all required fields including email and verification code' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify OTP
    const otpCheck = await client.query(
      'SELECT * FROM email_otps WHERE email = $1 AND otp = $2 AND expires_at > CURRENT_TIMESTAMP',
      [email, otp]
    );
    if (otpCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Delete used OTP
    await client.query('DELETE FROM email_otps WHERE email = $1', [email]);
    
    // Check if phone number exists
    const userExist = await client.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (userExist.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    // Process Referral Code
    let referredById = null;
    if (referralCode) {
      const referrerQuery = await client.query('SELECT id, referred_by FROM users WHERE referral_code = $1', [referralCode]);
      if (referrerQuery.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ message: 'Invalid referral code' });
      }
      referredById = referrerQuery.rows[0].id;
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
      'INSERT INTO users (name, phone, password, referral_code, referred_by, district_id, mandal_id, address, email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, name, phone, referral_code, wallet_balance, district_id, mandal_id, address, email',
      [name, phone, passwordHash, newReferralCode, referredById, district_id || null, mandal_id || null, address || null, email || null]
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
        email: user.email,
        address: user.address,
        district_id: user.district_id,
        mandal_id: user.mandal_id,
        referral_code: user.referral_code,
        wallet_balance: user.wallet_balance,
        subscriptions: []
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
  const { phoneOrEmail, password, otp } = req.body;

  if (!phoneOrEmail) {
    return res.status(400).json({ message: 'Phone number or email is required' });
  }

  if (!password && !otp) {
    return res.status(400).json({ message: 'Either password or verification code is required' });
  }

  try {
    // Find user
    const result = await pool.query('SELECT * FROM users WHERE phone = $1 OR email = $2', [phoneOrEmail, phoneOrEmail]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'User does not exist. Please register to login.' });
    }

    const user = result.rows[0];

    if (otp) {
      // Validate OTP
      const email = user.email;
      if (!email) {
        return res.status(400).json({ message: 'No email address associated with this account.' });
      }
      const otpCheck = await pool.query('SELECT * FROM email_otps WHERE email = $1 AND otp = $2', [email, otp]);
      if (otpCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }
      const otpRecord = otpCheck.rows[0];
      if (new Date() > new Date(otpRecord.expires_at)) {
        return res.status(400).json({ message: 'Verification code has expired' });
      }
      // Delete used OTP
      await pool.query('DELETE FROM email_otps WHERE email = $1', [email]);
    } else {
      // Check password
      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials. Password is incorrect.' });
      }
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
        email: user.email,
        address: user.address,
        district_id: user.district_id,
        mandal_id: user.mandal_id,
        referral_code: user.referral_code,
        wallet_balance: user.wallet_balance,
        subscriptions: []
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
      'SELECT id, name, phone, email, address, district_id, mandal_id, referral_code, wallet_balance FROM users WHERE id = $1',
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
              d.name AS "districtName", m.name AS "mandalName", s.status, s.payment_mode, s.remark,
              e.included_services, e.thumbnail
       FROM subscriptions s
       LEFT JOIN districts d ON s.district_id = d.id
       LEFT JOIN mandals m ON s.mandal_id = m.id
       LEFT JOIN events e ON e.event_name = s.event_name AND e.mandal_id = s.mandal_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    const subscriptions = subRes.rows.map(row => ({
      id: row.id,
      slotNumber: row.slot_number,
      plan: row.plan,
      validTill: row.valid_till,
      eventName: row.eventName,
      districtId: row.districtId,
      mandalId: row.mandalId,
      districtName: row.districtName,
      mandalName: row.mandalName,
      status: row.status,
      paymentMode: row.payment_mode,
      remark: row.remark,
      includedServices: row.included_services,
      thumbnail: row.thumbnail
    }));

    res.json({
      ...user,
      subscriptions
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

const sendOtp = async (req, res) => {
  const { email, phone, type, action, phoneOrEmail } = req.body; // type can be 'user' or 'vendor', action can be 'login' or 'register'

  if (action === 'login') {
    if (!phoneOrEmail) {
      return res.status(400).json({ message: 'Phone number or email is required' });
    }
  } else {
    if (!email || !phone) {
      return res.status(400).json({ message: 'Email and phone number are required' });
    }
  }

  try {
    let targetEmail = email;

    if (action === 'login') {
      const cleanVal = (phoneOrEmail || '').trim();
      const lowerVal = cleanVal.toLowerCase();
      if (type === 'vendor') {
        const vendorCheck = await pool.query(
          'SELECT email, status FROM vendors WHERE phone = $1 OR LOWER(email) = $2',
          [cleanVal, lowerVal]
        );
        if (vendorCheck.rows.length === 0) {
          return res.status(400).json({ message: 'No registered partner account found with this phone number or email' });
        }
        const vendor = vendorCheck.rows[0];
        if (vendor.status === 'Pending') {
          return res.status(403).json({ message: 'Your registration is pending administrator approval.' });
        }
        if (vendor.status === 'Rejected') {
          return res.status(403).json({ message: 'Your registration request was rejected by the administrator.' });
        }
        if (vendor.status === 'Deactivated') {
          return res.status(403).json({ message: 'Your account has been deactivated.' });
        }
        targetEmail = vendor.email;
      } else {
        const userCheck = await pool.query(
          'SELECT email FROM users WHERE phone = $1 OR LOWER(email) = $2',
          [cleanVal, lowerVal]
        );
        if (userCheck.rows.length === 0) {
          return res.status(400).json({ message: 'No registered user account found with this phone number or email' });
        }
        targetEmail = userCheck.rows[0].email;
      }
      if (!targetEmail) {
        return res.status(400).json({ message: 'No email address is associated with this account. Please use password login.' });
      }
    } else {
      // Validate if user already exists
      if (type === 'vendor') {
        const phoneCheck = await pool.query('SELECT id FROM vendors WHERE phone = $1', [phone]);
        if (phoneCheck.rows.length > 0) {
          return res.status(400).json({ message: 'A partner with this phone number already exists' });
        }
        const emailCheck = await pool.query('SELECT id FROM vendors WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
          return res.status(400).json({ message: 'A partner with this email address already exists' });
        }
      } else {
        const phoneCheck = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
        if (phoneCheck.rows.length > 0) {
          return res.status(400).json({ message: 'User with this phone number already exists. Please sign in instead.' });
        }
        const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
          return res.status(400).json({ message: 'User with this email address already exists. Please sign in instead.' });
        }
      }
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Clear old OTPs and insert new
    await pool.query('DELETE FROM email_otps WHERE email = $1', [targetEmail]);
    await pool.query(
      'INSERT INTO email_otps (email, otp, expires_at) VALUES ($1, $2, $3)',
      [targetEmail, otp, expiresAt]
    );

    // Send email
    await sendOtpEmail(targetEmail, otp);

    // Mask target email for response (e.g. jo***@domain.com)
    const atIdx = targetEmail.indexOf('@');
    const maskedEmail = targetEmail.substring(0, Math.min(2, atIdx)) + '***' + targetEmail.substring(atIdx);

    res.json({ success: true, message: 'Verification code sent successfully', email: maskedEmail });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send verification code. Please check your email address.' });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  sendOtp
};
