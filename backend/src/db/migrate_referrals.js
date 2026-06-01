const pool = require('../config/db');
require('dotenv').config();

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting Referrals & Wallet Migration...');
    await client.query('BEGIN');

    // 1. Add columns to users table
    console.log('Adding referral columns to users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS referral_code VARCHAR(7) UNIQUE,
      ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10, 2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
    `);

    // 2. Create withdrawals table
    console.log('Creating withdrawals table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        account_name VARCHAR(100) NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        ifsc_code VARCHAR(20) NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Generate referral codes for existing users (optional fallback)
    console.log('Generating referral codes for existing users without one...');
    const existingUsers = await client.query('SELECT id FROM users WHERE referral_code IS NULL');
    for (let user of existingUsers.rows) {
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 7; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      
      let unique = false;
      let code;
      while(!unique) {
        code = generateCode();
        const check = await client.query('SELECT id FROM users WHERE referral_code = $1', [code]);
        if(check.rows.length === 0) unique = true;
      }
      
      await client.query('UPDATE users SET referral_code = $1 WHERE id = $2', [code, user.id]);
    }

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    pool.end();
  }
};

migrate();
