const pool = require('../config/db');

async function runMigration() {
  console.log('Starting referral_paid migration...');
  
  try {
    // Add referral_paid column to users table
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS referral_paid BOOLEAN DEFAULT FALSE;
    `);
    
    console.log('Successfully added referral_paid column to users table.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
