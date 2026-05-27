const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const createTables = async () => {
  const client = await pool.connect();
  try {
    console.log('Initializing database tables...');
    
    // Drop existing tables to perform clean migration
    console.log('Dropping existing tables to migrate schema...');
    await client.query('DROP TABLE IF EXISTS bookings, subscriptions, mandals, districts, vendor_services, vendor_leaves, settlements, vendors, services, users, admins CASCADE;');

    // Create Districts Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS districts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL
      );
    `);

    // Create Mandals Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS mandals (
        id SERIAL PRIMARY KEY,
        district_id INTEGER REFERENCES districts(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        event_names TEXT NOT NULL,
        slots TEXT NOT NULL,
        subscription_price NUMERIC(10, 2) NOT NULL DEFAULT 2999.00,
        booking_price NUMERIC(10, 2) NOT NULL DEFAULT 199.00,
        UNIQUE(district_id, name)
      );
    `);

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
        district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
        mandal_id INTEGER REFERENCES mandals(id) ON DELETE SET NULL,
        event_name VARCHAR(100) NOT NULL,
        slot_number VARCHAR(50) NOT NULL,
        plan VARCHAR(100) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        valid_till TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(mandal_id, slot_number)
      );
    `);

    // Create Vendors Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending',
        district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
        mandal_id INTEGER REFERENCES mandals(id) ON DELETE SET NULL,
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

    // Create Vendor Services Linker Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_services (
        vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
        service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
        PRIMARY KEY (vendor_id, service_id)
      );
    `);

    // Create Settlements Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS settlements (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved_at TIMESTAMP
      );
    `);

    // Create Vendor Leaves Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_leaves (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
        leave_date VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (vendor_id, leave_date)
      );
    `);

    // Create Bookings Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(50) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        district_id INTEGER REFERENCES districts(id) ON DELETE SET NULL,
        mandal_id INTEGER REFERENCES mandals(id) ON DELETE SET NULL,
        event_name VARCHAR(100),
        slot_number VARCHAR(50),
        service_name VARCHAR(100) NOT NULL,
        date VARCHAR(100) NOT NULL,
        price NUMERIC(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'Booked',
        icon VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        vendor_id INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
        otp VARCHAR(4) DEFAULT '1234',
        settlement_id INTEGER REFERENCES settlements(id) ON DELETE SET NULL
      );
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

    // Seed Districts and Mandals
    console.log('Seeding Districts and Mandals...');
    const district1 = await client.query('INSERT INTO districts (name) VALUES ($1) RETURNING id, name', ['Krishna']);
    const district2 = await client.query('INSERT INTO districts (name) VALUES ($1) RETURNING id, name', ['Guntur']);
    const district3 = await client.query('INSERT INTO districts (name) VALUES ($1) RETURNING id, name', ['Visakhapatnam']);

    const krishnaId = district1.rows[0].id;
    const gunturId = district2.rows[0].id;
    const vizagId = district3.rows[0].id;

    // Seed Mandals under Krishna
    const mandal1 = await client.query(
      `INSERT INTO mandals (district_id, name, event_names, slots, subscription_price, booking_price) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [krishnaId, 'Vijayawada Urban', 'AC Service, Wiring Repair, General Checkup', '101, 102, 103, 104, 105', 2499.00, 149.00]
    );
    const mandal2 = await client.query(
      `INSERT INTO mandals (district_id, name, event_names, slots, subscription_price, booking_price) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [krishnaId, 'Vijayawada Rural', 'General Checkup, Fan Repair, Switchboard Fix', '201, 202, 203', 1999.00, 99.00]
    );

    // Seed Mandals under Guntur
    const mandal3 = await client.query(
      `INSERT INTO mandals (district_id, name, event_names, slots, subscription_price, booking_price) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [gunturId, 'Guntur Urban', 'Wiring Audit, Appliance Repair, Lighting Install', '301, 302, 303, 304, 305', 2799.00, 179.00]
    );
    const mandal4 = await client.query(
      `INSERT INTO mandals (district_id, name, event_names, slots, subscription_price, booking_price) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [gunturId, 'Tenali', 'Motor Repair, Fan Fix, Socket Replacement', '401, 402, 403', 2199.00, 129.00]
    );

    // Seed Technician John (Vendor)
    console.log('Seeding mock approved vendor Technician John...');
    const vendorPasswordHash = bcrypt.hashSync('password123', 10);
    const vendorRes = await client.query(
      `INSERT INTO vendors (name, phone, password, district_id, mandal_id, status) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      ['Technician John', '+91 99999 88888', vendorPasswordHash, krishnaId, mandal1.rows[0].id, 'Approved']
    );
    const vendorId = vendorRes.rows[0].id;

    // Link the seeded vendor to default services
    console.log('Linking vendor to default services...');
    const servicesRes = await client.query('SELECT id FROM services');
    for (const serviceRow of servicesRes.rows) {
      await client.query(
        'INSERT INTO vendor_services (vendor_id, service_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [vendorId, serviceRow.id]
      );
    }

    // Seed mock Users, Subscriptions, and Bookings
    console.log('Seeding mock users, subscriptions, and bookings...');
    const p1 = bcrypt.hashSync('password123', 10);
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

    // Insert subscriptions
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    // Ravi -> Vijayawada Urban (slot 101)
    await client.query(
      `INSERT INTO subscriptions (id, user_id, district_id, mandal_id, event_name, slot_number, plan, price, valid_till) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ['NGPC-114920', insertedUsers[0].id, krishnaId, mandal1.rows[0].id, 'AC Service', '101', 'Annual · ₹2499/year', 2499.00, nextYear]
    );

    // Anjali -> Guntur Urban (slot 301)
    await client.query(
      `INSERT INTO subscriptions (id, user_id, district_id, mandal_id, event_name, slot_number, plan, price, valid_till) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ['NGPC-502187', insertedUsers[1].id, gunturId, mandal3.rows[0].id, 'Wiring Audit', '301', 'Annual · ₹2799/year', 2799.00, nextYear]
    );

    // Vikram -> Tenali (slot 401)
    await client.query(
      `INSERT INTO subscriptions (id, user_id, district_id, mandal_id, event_name, slot_number, plan, price, valid_till) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      ['NGPC-187745', insertedUsers[2].id, gunturId, mandal4.rows[0].id, 'Motor Repair', '401', 'Annual · ₹2199/year', 2199.00, nextYear]
    );

    // Insert mock bookings (referencing districts/mandals)
    const bookingsData = [
      // Ravi Bookings
      ['B-1042', insertedUsers[0].id, krishnaId, mandal1.rows[0].id, 'AC Service', '101', 'Fan Repair', '12 Apr 2026 (Morning)', 0.00, 'Completed', 'sync-outline', 'Flat 405, Block B, Green Glen Layout, Near Central Mall - 560103'],
      ['B-1031', insertedUsers[0].id, krishnaId, mandal1.rows[0].id, 'AC Service', '101', 'Switchboard Repair', '28 Mar 2026 (Afternoon)', 0.00, 'Completed', 'toggle-outline', 'Flat 405, Block B, Green Glen Layout, Near Central Mall - 560103'],
      
      // Anjali Bookings
      ['B-1051', insertedUsers[1].id, gunturId, mandal3.rows[0].id, 'Wiring Audit', '301', 'Wiring Issue', '22 May 2026 (Morning)', 0.00, 'Booked', 'flash-outline', 'Apt 12A, Sunset Heights, Whitefield - 560066'],
      
      // Vikram Bookings
      ['B-1055', insertedUsers[2].id, gunturId, mandal4.rows[0].id, 'Motor Repair', '401', 'Fan Repair', '24 May 2026 (Afternoon)', 0.00, 'Booked', 'sync-outline', 'House 78, 4th Cross, Indiranagar - 560038'],

      // Priya Bookings (Non-subscriber booking - Guntur Urban, Wiring Audit, slot 302, Guntur Urban booking price: 179)
      ['B-1056', insertedUsers[3].id, gunturId, mandal3.rows[0].id, 'Wiring Audit', '302', 'Wiring Issue', '25 May 2026 (Morning)', 179.00, 'Booked', 'flash-outline', 'Villa 9, Prestige Lakeview, Outer Ring Road - 560103']
    ];

    for (const booking of bookingsData) {
      await client.query(
        `INSERT INTO bookings (id, user_id, district_id, mandal_id, event_name, slot_number, service_name, date, price, status, icon, address) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        booking
      );
    }

    console.log('Seeded database successfully.');
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
