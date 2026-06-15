const pool = require('../config/db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');

    // Create enquiries table safely
    await client.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        phone VARCHAR(20),
        subject VARCHAR(50) DEFAULT 'support',
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'New',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    // Add new columns to users table
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS mandal_id INTEGER REFERENCES mandals(id) ON DELETE SET NULL;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    `);
    
    // Add remark column to subscriptions table
    await client.query(`
      ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS remark TEXT;
    `);
    
    console.log('Successfully migrated database tables.');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrate();
