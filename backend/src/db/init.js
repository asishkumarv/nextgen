const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const createTables = async () => {
  const client = await pool.connect();
  try {
    console.log('Initializing database tables...');
    
    // Create Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Subscriptions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id VARCHAR(50) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        slot_number INTEGER UNIQUE NOT NULL,
        plan VARCHAR(100) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        valid_till TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Bookings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(50) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        service_name VARCHAR(100) NOT NULL,
        date VARCHAR(100) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'Booked',
        icon VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Alter bookings table to add vendor_id references if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_services (
        vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
        service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
        PRIMARY KEY (vendor_id, service_id)
      );
    `);

    await client.query(`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL;
    `);

    // Create Admins Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create Services Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        title VARCHAR(100) NOT NULL,
        subtitle VARCHAR(255) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        icon VARCHAR(50) DEFAULT 'construct-outline',
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Tables created successfully.');

    // Seeding default Admin
    const adminCheck = await client.query('SELECT * FROM admins WHERE email = $1', ['admin@nextgen.com']);
    if (adminCheck.rows.length === 0) {
      console.log('Seeding default administrator account...');
      const adminPasswordHash = bcrypt.hashSync('adminpassword', 10);
      await client.query(
        'INSERT INTO admins (email, password, name) VALUES ($1, $2, $3)',
        ['admin@nextgen.com', adminPasswordHash, 'Nextgen Administrator']
      );
      console.log('Admin account created (email: admin@nextgen.com, password: adminpassword)');
    }

    // Seeding default Services if empty
    const serviceCheck = await client.query('SELECT COUNT(*) FROM services');
    if (parseInt(serviceCheck.rows[0].count) === 0) {
      console.log('Seeding default services...');
      const servicesData = [
        ['Mixi Repair', 'Motor, blade & switch repair', 199.00, 'construct-outline', 'Active'],
        ['Grinder Repair', 'Stone & motor servicing', 249.00, 'construct-outline', 'Active'],
        ['Fan Repair', 'Ceiling, table & exhaust fans', 149.00, 'sync-outline', 'Active'],
        ['Wiring Issue', 'Short circuits & rewiring', 299.00, 'flash-outline', 'Active'],
        ['Switchboard Repair', 'Sockets, switches, MCB', 99.00, 'toggle-outline', 'Active']
      ];
      for (const service of servicesData) {
        await client.query(
          'INSERT INTO services (title, subtitle, price, icon, status) VALUES ($1, $2, $3, $4, $5)',
          service
        );
      }
      console.log('Services seeded successfully.');
    }

    // Seeding mock Users if empty
    const userCheck = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCheck.rows[0].count) === 0) {
      console.log('Seeding mock users, subscriptions, and bookings...');
      
      const p1 = bcrypt.hashSync('password123', 10);
      
      // Insert 5 users
      const usersData = [
        ['Ravi Kumar', '+91 98765 43210', p1],
        ['Anjali Sharma', '+91 91234 56789', p1],
        ['Vikram Singh', '+91 98123 45678', p1],
        ['Priya Patel', '+91 99887 76655', p1],
        ['Siddharth Rao', '+91 97654 32109', p1]
      ];
      
      const insertedUsers = [];
      for (const userData of usersData) {
        const res = await client.query(
          'INSERT INTO users (name, phone, password) VALUES ($1, $2, $3) RETURNING id, name',
          userData
        );
        insertedUsers.push(res.rows[0]);
      }

      // Insert subscriptions for Ravi (114), Anjali (502), Vikram (1877)
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      await client.query(
        'INSERT INTO subscriptions (id, user_id, slot_number, plan, price, valid_till) VALUES ($1, $2, $3, $4, $5, $6)',
        ['NGPC-114920', insertedUsers[0].id, 114, 'Annual · ₹2999/year', 2999.00, nextYear]
      );

      await client.query(
        'INSERT INTO subscriptions (id, user_id, slot_number, plan, price, valid_till) VALUES ($1, $2, $3, $4, $5, $6)',
        ['NGPC-502187', insertedUsers[1].id, 502, 'Annual · ₹2999/year', 2999.00, nextYear]
      );

      await client.query(
        'INSERT INTO subscriptions (id, user_id, slot_number, plan, price, valid_till) VALUES ($1, $2, $3, $4, $5, $6)',
        ['NGPC-187745', insertedUsers[2].id, 1877, 'Annual · ₹2999/year', 2999.00, nextYear]
      );

      // Insert 10 bookings
      const bookingsData = [
        // Ravi Bookings
        ['B-1042', insertedUsers[0].id, 'Fan Repair', '12 Apr 2026 (Morning)', 149.00, 'Completed', 'sync-outline', 'Flat 405, Block B, Green Glen Layout, Near Central Mall - 560103'],
        ['B-1031', insertedUsers[0].id, 'Switchboard Repair', '28 Mar 2026 (Afternoon)', 99.00, 'Completed', 'toggle-outline', 'Flat 405, Block B, Green Glen Layout, Near Central Mall - 560103'],
        ['B-1019', insertedUsers[0].id, 'Wiring Issue', '14 Feb 2026 (Morning)', 299.00, 'Completed', 'flash-outline', 'Flat 405, Block B, Green Glen Layout, Near Central Mall - 560103'],
        
        // Anjali Bookings
        ['B-1051', insertedUsers[1].id, 'A/C Wiring Repair', '22 May 2026 (Morning)', 399.00, 'Booked', 'flash-outline', 'Apt 12A, Sunset Heights, Whitefield - 560066'],
        ['B-1025', insertedUsers[1].id, 'Fan Installation', '10 Mar 2026 (Evening)', 199.00, 'Completed', 'sync-outline', 'Apt 12A, Sunset Heights, Whitefield - 560066'],

        // Vikram Bookings
        ['B-1055', insertedUsers[2].id, 'Inverter Battery Checkup', '24 May 2026 (Afternoon)', 249.00, 'Booked', 'construct-outline', 'House 78, 4th Cross, Indiranagar - 560038'],

        // Priya Bookings
        ['B-1056', insertedUsers[3].id, 'Complete House Wiring Audit', '25 May 2026 (Morning)', 999.00, 'Booked', 'flash-outline', 'Villa 9, Prestige Lakeview, Outer Ring Road - 560103'],
        
        // Siddharth Bookings
        ['B-1057', insertedUsers[4].id, 'Geyser Circuit Repair', '26 May 2026 (Evening)', 349.00, 'Booked', 'toggle-outline', 'Room 102, PG PG Comforts, HSR Layout - 560102'],
        ['B-1028', insertedUsers[4].id, 'Exhaust Fan Repair', '18 Mar 2026 (Morning)', 149.00, 'Completed', 'sync-outline', 'Room 102, PG PG Comforts, HSR Layout - 560102'],
        ['B-1012', insertedUsers[4].id, 'Doorbell Replacement', '05 Jan 2026 (Afternoon)', 79.00, 'Completed', 'construct-outline', 'Room 102, PG PG Comforts, HSR Layout - 560102']
      ];

      for (const booking of bookingsData) {
        await client.query(
          'INSERT INTO bookings (id, user_id, service_name, date, price, status, icon, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
          booking
        );
      }

      console.log('Seeded database successfully.');
    } else {
      console.log('Database already has data. Skipping seed.');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  createTables()
    .then(() => {
      console.log('Database script ran successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Database script failed:', err);
      process.exit(1);
    });
}

module.exports = { createTables };
