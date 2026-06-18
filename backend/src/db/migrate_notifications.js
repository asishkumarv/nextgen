const pool = require('../config/db');

const migrateNotificationsTable = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting migration to add notifications table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Notifications table successfully created or already exists.');
  } catch (error) {
    console.error('Error creating notifications table:', error);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrateNotificationsTable();
