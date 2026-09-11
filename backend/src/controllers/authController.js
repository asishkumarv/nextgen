const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
// const { sendOtpEmail } = require('../utils/mailer'); // Email OTP on hold
const { sendSmsOtp } = require('../utils/sms');

const register = async (req, res) => {
  const { name, phone, password, referralCode, district_id, mandal_id, address, email, otp } = req.body;

  if (!name || !phone || !password || !district_id || !mandal_id || !otp) {
    return res.status(400).json({ message: 'Please enter all required fields including phone verification code' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify OTP (check against phone number or email)
    const otpCheck = await client.query(
      'SELECT * FROM email_otps WHERE (email = $1 OR email = $2) AND otp = $3 AND expires_at > CURRENT_TIMESTAMP',
      [phone.trim(), (email || '').trim(), otp.trim()]
    );
    if (otpCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Invalid or expired SMS verification code' });
    }

    // Delete used OTP
    await client.query('DELETE FROM email_otps WHERE email = $1 OR email = $2', [phone.trim(), (email || '').trim()]);
    
    // Check if phone number exists
    const userExist = await client.query('SELECT * FROM users WHERE phone = $1', [phone]);
    if (userExist.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'User with this phone number already exists' });
    }

    // Process Referral Code
    let referredById = null;
    if (referralCode) {
      const refCheck = await client.query('SELECT id FROM users WHERE referral_code = $1', [referralCode.trim().toUpperCase()]);
      if (refCheck.rows.length > 0) {
        referredById = refCheck.rows[0].id;
      }
    }

    // Generate Unique Referral Code (e.g. NGPC-5928)
    const userReferralCode = `NGPC-${Math.floor(1000 + Math.random() * 9000)}`;

    // Hash password
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Insert new user
    const newUser = await client.query(
      'INSERT INTO users (name, phone, password, referral_code, referred_by, district_id, mandal_id, address, email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, name, phone, wallet_balance, referral_code, district_id, mandal_id, address, email',
      [name, phone, passwordHash, userReferralCode, referredById, district_id, mandal_id, address || null, email || null]
    );

    const user = newUser.rows[0];

    // If referred, credit ₹50 to referrer wallet
    if (referredById) {
      await client.query('UPDATE users SET wallet_balance = wallet_balance + 50.00 WHERE id = $1', [referredById]);
    }

    await client.query('COMMIT');

    // Generate JWT
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
        walletBalance: user.wallet_balance,
        referralCode: user.referral_code,
        district_id: user.district_id,
        mandal_id: user.mandal_id,
        address: user.address,
        email: user.email
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
      // Validate OTP against user's phone or email
      const otpCheck = await pool.query(
        'SELECT * FROM email_otps WHERE (email = $1 OR email = $2) AND otp = $3',
        [user.phone, user.email || user.phone, otp.trim()]
      );
      if (otpCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Invalid SMS verification code' });
      }
      const otpRecord = otpCheck.rows[0];
      if (new Date() > new Date(otpRecord.expires_at)) {
        return res.status(400).json({ message: 'Verification code has expired' });
      }
      // Delete used OTP
      await pool.query('DELETE FROM email_otps WHERE email = $1 OR email = $2', [user.phone, user.email || user.phone]);
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
        walletBalance: user.wallet_balance,
        referralCode: user.referral_code,
        district_id: user.district_id,
        mandal_id: user.mandal_id,
        address: user.address,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const getMe = async (req, res) => {
  try {
    const userResult = await pool.query(
      `SELECT u.id, u.name, u.phone, u.wallet_balance, u.referral_code, u.district_id, u.mandal_id, u.address, u.email
       FROM users u
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Fetch active user subscriptions
    const subResult = await pool.query(
      `SELECT s.id, s.event_name AS "eventName", s.slot_number AS "slotNumber", s.plan, s.price, s.status, s.valid_till AS "validTill",
              s.district_id AS "districtId", s.mandal_id AS "mandalId", s.payment_mode AS "paymentMode", s.remark,
              d.name AS "districtName", m.name AS "mandalName", e.description AS "thumbnail", e.included_services AS "includedServices"
       FROM subscriptions s
       LEFT JOIN districts d ON s.district_id = d.id
       LEFT JOIN mandals m ON s.mandal_id = m.id
       LEFT JOIN events e ON s.event_id = e.id
       WHERE s.user_id = $1 AND s.status != 'Cancelled'
       ORDER BY s.created_at DESC`,
      [req.user.id]
    );

    res.json({
      id: user.id,
      name: user.name,
      phone: user.phone,
      wallet_balance: user.wallet_balance,
      referral_code: user.referral_code,
      district_id: user.district_id,
      mandal_id: user.mandal_id,
      address: user.address,
      email: user.email,
      subscriptions: subResult.rows
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

const updateProfile = async (req, res) => {
  const { name, phone, district_id, mandal_id, address, email } = req.body;
  const userId = req.user.id;

  try {
    const updateResult = await pool.query(
      `UPDATE users 
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           district_id = COALESCE($3, district_id),
           mandal_id = COALESCE($4, mandal_id),
           address = COALESCE($5, address),
           email = COALESCE($6, email)
       WHERE id = $7
       RETURNING id, name, phone, wallet_balance, referral_code, district_id, mandal_id, address, email`,
      [name, phone, district_id, mandal_id, address, email, userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please enter both current and new passwords' });
  }

  try {
    const userRes = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRes.rows[0];
    const isMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newPasswordHash = bcrypt.hashSync(newPassword, salt);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newPasswordHash, userId]);

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error updating password' });
  }
};

const sendOtp = async (req, res) => {
  const { email, phone, type, action, phoneOrEmail } = req.body;

  if (action === 'login') {
    if (!phoneOrEmail) {
      return res.status(400).json({ message: 'Phone number or email is required' });
    }
  } else {
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required for SMS verification' });
    }
  }

  try {
    let targetPhone = phone ? phone.trim() : null;
    let targetEmail = email ? email.trim() : null;

    if (action === 'login') {
      const cleanVal = (phoneOrEmail || '').trim();
      const lowerVal = cleanVal.toLowerCase();
      if (type === 'vendor') {
        const vendorCheck = await pool.query(
          'SELECT phone, email, status FROM vendors WHERE phone = $1 OR LOWER(email) = $2',
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
        targetPhone = vendor.phone;
        targetEmail = vendor.email;
      } else {
        const userCheck = await pool.query(
          'SELECT phone, email FROM users WHERE phone = $1 OR LOWER(email) = $2',
          [cleanVal, lowerVal]
        );
        if (userCheck.rows.length === 0) {
          return res.status(400).json({ message: 'No registered user account found with this phone number or email' });
        }
        targetPhone = userCheck.rows[0].phone;
        targetEmail = userCheck.rows[0].email;
      }
    } else {
      // Validate if user already exists
      if (type === 'vendor') {
        if (phone) {
          const phoneCheck = await pool.query('SELECT id FROM vendors WHERE phone = $1', [phone.trim()]);
          if (phoneCheck.rows.length > 0) {
            return res.status(400).json({ message: 'A partner with this phone number already exists' });
          }
        }
      } else {
        if (phone) {
          const phoneCheck = await pool.query('SELECT id FROM users WHERE phone = $1', [phone.trim()]);
          if (phoneCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User with this phone number already exists. Please sign in instead.' });
          }
        }
      }
    }

    if (!targetPhone) {
      return res.status(400).json({ message: 'Phone number is missing. Cannot send SMS verification.' });
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    /* ================= EMAIL OTP CODE (ON HOLD / COMMENTED OUT) =================
    // Clear old email OTPs and insert new
    // await pool.query('DELETE FROM email_otps WHERE email = $1', [targetEmail]);
    // await pool.query(
    //   'INSERT INTO email_otps (email, otp, expires_at) VALUES ($1, $2, $3)',
    //   [targetEmail, otp, expiresAt]
    // );
    // await sendOtpEmail(targetEmail, otp);
    ============================================================================= */

    // Save OTP against phone number (and targetEmail) for verification
    await pool.query('DELETE FROM email_otps WHERE email = $1 OR email = $2', [targetPhone, targetEmail || targetPhone]);
    await pool.query(
      'INSERT INTO email_otps (email, otp, expires_at) VALUES ($1, $2, $3)',
      [targetPhone, otp, expiresAt]
    );
    if (targetEmail && targetEmail !== targetPhone) {
      await pool.query(
        'INSERT INTO email_otps (email, otp, expires_at) VALUES ($1, $2, $3)',
        [targetEmail, otp, expiresAt]
      );
    }

    // Send SMS via Twilio
    await sendSmsOtp(targetPhone, otp);

    // Mask phone number for response (e.g. ******3210)
    const maskedPhone = targetPhone.length > 4 ? '******' + targetPhone.slice(-4) : targetPhone;

    res.json({ success: true, message: 'SMS verification code sent successfully via Twilio', phone: maskedPhone });
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    res.status(500).json({ message: error.message || 'Failed to send SMS verification code.' });
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
