const pool = require('../config/db');

const User = {
  async findById(id) {
    const res = await pool.query('SELECT id, name, phone, district_id, mandal_id, address, email, created_at FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async findByPhone(phone) {
    const res = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    return res.rows[0] || null;
  },

  async create(name, phone, passwordHash, district_id = null, mandal_id = null, address = null, email = null) {
    const res = await pool.query(
      'INSERT INTO users (name, phone, password, district_id, mandal_id, address, email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, phone, district_id, mandal_id, address, email, created_at',
      [name, phone, passwordHash, district_id, mandal_id, address, email]
    );
    return res.rows[0];
  },

  async update(id, name, phone) {
    const res = await pool.query(
      'UPDATE users SET name = $1, phone = $2 WHERE id = $3 RETURNING id, name, phone, created_at',
      [name, phone, id]
    );
    return res.rows[0];
  },

  async isPhoneTaken(phone, excludeUserId = null) {
    let query = 'SELECT id FROM users WHERE phone = $1';
    let params = [phone];
    if (excludeUserId) {
      query += ' AND id != $2';
      params.push(excludeUserId);
    }
    const res = await pool.query(query, params);
    return res.rows.length > 0;
  },

  async getAll() {
    const res = await pool.query('SELECT id, name, phone, district_id, mandal_id, address, email, created_at FROM users ORDER BY created_at DESC');
    return res.rows;
  },

  async count() {
    const res = await pool.query('SELECT COUNT(*)::int FROM users');
    return res.rows[0].count;
  }
};

const Subscription = {
  async findByUserId(userId) {
    const res = await pool.query(
      'SELECT id, slot_number as "slotNumber", plan, price, valid_till as "validTill", created_at FROM subscriptions WHERE user_id = $1',
      [userId]
    );
    return res.rows[0] || null;
  },

  async create(id, userId, slotNumber, plan, price, validTill) {
    const res = await pool.query(
      'INSERT INTO subscriptions (id, user_id, slot_number, plan, price, valid_till) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, user_id as "userId", slot_number as "slotNumber", plan, price, valid_till as "validTill"',
      [id, userId, slotNumber, plan, price, validTill]
    );
    return res.rows[0];
  },

  async deleteByUserId(userId) {
    const res = await pool.query('DELETE FROM subscriptions WHERE user_id = $1 RETURNING id', [userId]);
    return res.rows.length > 0;
  },

  async getBookedSlots() {
    const res = await pool.query('SELECT slot_number as "slotNumber" FROM subscriptions');
    return res.rows.map(row => row.slotNumber);
  },

  async getAllWithUserDetails() {
    const res = await pool.query(`
      SELECT s.id, s.slot_number as "slotNumber", s.plan, s.price, s.valid_till as "validTill", s.created_at,
             u.name as "userName", u.phone as "userPhone"
      FROM subscriptions s
      JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);
    return res.rows;
  },

  async count() {
    const res = await pool.query('SELECT COUNT(*)::int FROM subscriptions');
    return res.rows[0].count;
  },

  async sumRevenue() {
    const res = await pool.query('SELECT SUM(price)::float as revenue FROM subscriptions');
    return res.rows[0].revenue || 0.0;
  }
};

const Booking = {
  async findById(id) {
    const res = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async findByUserId(userId) {
    const res = await pool.query(
      'SELECT id, service_name as "serviceName", date, price, status, icon, address FROM bookings WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.rows;
  },

  async create(id, userId, serviceName, date, price, icon, address) {
    const res = await pool.query(
      'INSERT INTO bookings (id, user_id, service_name, date, price, icon, address) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, service_name as "serviceName", date, price, status, icon, address',
      [id, userId, serviceName, date, price, icon, address]
    );
    return res.rows[0];
  },

  async updateStatus(id, status) {
    const res = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, id]
    );
    return res.rows[0] || null;
  },

  async delete(id) {
    const res = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING id', [id]);
    return res.rows.length > 0;
  },

  async getAllWithUserDetails() {
    const res = await pool.query(`
      SELECT b.id, b.service_name as "serviceName", b.date, b.price, b.status, b.icon, b.address, b.created_at,
             u.name as "userName", u.phone as "userPhone"
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
    `);
    return res.rows;
  },

  async count() {
    const res = await pool.query('SELECT COUNT(*)::int FROM bookings');
    return res.rows[0].count;
  }
};

const Admin = {
  async findByEmail(email) {
    const res = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    return res.rows[0] || null;
  },

  async findById(id) {
    const res = await pool.query('SELECT id, email, name FROM admins WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async create(name, email, passwordHash) {
    const res = await pool.query(
      'INSERT INTO admins (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash]
    );
    return res.rows[0];
  }
};

const Service = {
  async getAll() {
    const res = await pool.query('SELECT * FROM services ORDER BY id ASC');
    return res.rows;
  },

  async getAllActive() {
    const res = await pool.query("SELECT * FROM services WHERE status = 'Active' ORDER BY id ASC");
    return res.rows;
  },

  async findById(id) {
    const res = await pool.query('SELECT * FROM services WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async create(title, subtitle, price, icon) {
    const res = await pool.query(
      'INSERT INTO services (title, subtitle, price, icon, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, subtitle, price, icon || 'construct-outline', 'Active']
    );
    return res.rows[0];
  },

  async update(id, title, subtitle, price, icon, status) {
    const res = await pool.query(
      'UPDATE services SET title = $1, subtitle = $2, price = $3, icon = $4, status = $5 WHERE id = $6 RETURNING *',
      [title, subtitle, price, icon, status, id]
    );
    return res.rows[0] || null;
  },

  async updateStatus(id, status) {
    const res = await pool.query(
      'UPDATE services SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return res.rows[0] || null;
  },

  async delete(id) {
    const res = await pool.query('DELETE FROM services WHERE id = $1 RETURNING *', [id]);
    return res.rows.length > 0;
  }
};

module.exports = {
  User,
  Subscription,
  Booking,
  Admin,
  Service
};

