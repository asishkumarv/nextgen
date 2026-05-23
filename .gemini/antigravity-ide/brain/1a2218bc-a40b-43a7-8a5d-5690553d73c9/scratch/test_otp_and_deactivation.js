const pool = require('c:/Users/Lohitha Asish/Desktop/Nextgen app/backend/src/config/db');
const http = require('http');

// Helper to make HTTP requests using native http module
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = responseBody ? JSON.parse(responseBody) : {};
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: responseBody });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(data);
    }
    req.end();
  });
}

async function runTest() {
  console.log('--- Starting OTP, Date Check & Deactivation Validation ---');
  const client = await pool.connect();
  try {
    // 1. Clean up potential old test entries
    console.log('Cleaning up old test entries...');
    await client.query("DELETE FROM bookings WHERE address = 'TEST_OTP_ADDRESS'");
    await client.query("DELETE FROM vendor_services WHERE vendor_id IN (SELECT id FROM vendors WHERE name LIKE 'TEST_V_%')");
    await client.query("DELETE FROM vendors WHERE name LIKE 'TEST_V_%'");
    await client.query("DELETE FROM users WHERE name = 'TEST_U'");

    // 2. Create test user
    console.log('Creating test user...');
    const userRes = await client.query(
      "INSERT INTO users (name, phone, password) VALUES ('TEST_U', '+91 99999 77777', 'password') RETURNING id"
    );
    const userId = userRes.rows[0].id;

    // 3. Create test vendor (Approved)
    console.log('Creating test vendor...');
    const bcrypt = require('bcryptjs');
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('testpass123', salt);
    const vendorRes = await client.query(
      "INSERT INTO vendors (name, phone, password, status) VALUES ('TEST_V_1', '+91 77777 66666', $1, 'Approved') RETURNING id, status",
      [passwordHash]
    );
    const vendorId = vendorRes.rows[0].id;
    console.log(`Created Vendor with ID: ${vendorId}, Status: ${vendorRes.rows[0].status}`);

    // Let's first test login for Approved Vendor
    console.log('\n--- Testing Vendor Login (Approved) ---');
    const loginResApproved = await request('POST', '/api/vendor/login', {
      phone: '+91 77777 66666',
      password: 'testpass123'
    });
    console.log('Login Response Approved status code:', loginResApproved.statusCode);
    if (loginResApproved.statusCode !== 200) {
      throw new Error(`Expected login to succeed for Approved vendor, got status: ${loginResApproved.statusCode}`);
    }
    const vendorToken = loginResApproved.body.token;
    console.log('Approved Vendor Login success! Token acquired.');

    // 4. Test Deactivation
    console.log('\n--- Testing Admin Deactivate Vendor ---');
    // We can simulate deactivation through direct DB update or via admin endpoint.
    // Let's use direct DB first to see if deactivation works, then we can check login block.
    console.log('Updating vendor status to Deactivated in DB...');
    await client.query("UPDATE vendors SET status = 'Deactivated' WHERE id = $1", [vendorId]);

    console.log('Testing login for Deactivated vendor...');
    const loginResDeactivated = await request('POST', '/api/vendor/login', {
      phone: '+91 77777 66666',
      password: 'testpass123'
    });
    console.log('Login Response Deactivated status code:', loginResDeactivated.statusCode);
    console.log('Response body:', loginResDeactivated.body);
    if (loginResDeactivated.statusCode !== 403) {
      throw new Error(`Expected 403 Forbidden for Deactivated vendor, got: ${loginResDeactivated.statusCode}`);
    }
    if (!loginResDeactivated.body.message.includes('deactivated')) {
      throw new Error(`Expected message to mention 'deactivated', got: ${loginResDeactivated.body.message}`);
    }
    console.log('Deactivation login block verified successfully!');

    // Let's restore to Approved for the rest of the test
    await client.query("UPDATE vendors SET status = 'Approved' WHERE id = $1", [vendorId]);

    // 5. Create Booking in future (Tomorrow) for Date Check validation
    console.log('\n--- Testing Completion Prior to Scheduled Date check ---');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Format tomorrow as DD Month YYYY (e.g. 24 May 2026)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const tomorrowStr = `${tomorrow.getDate()} ${monthNames[tomorrow.getMonth()]} ${tomorrow.getFullYear()}`;
    const otpCode = '9876';

    const bookingRes = await client.query(
      `INSERT INTO bookings (id, user_id, service_name, date, price, status, icon, address, vendor_id, otp)
       VALUES ('TEST-OTP-B1', $1, 'Wiring Issue', $2, 299.00, 'Assigned', 'flash-outline', 'TEST_OTP_ADDRESS', $3, $4)
       RETURNING id, date, otp`,
      [userId, tomorrowStr + ' (10:00 AM - 12:00 PM)', vendorId, otpCode]
    );
    const booking = bookingRes.rows[0];
    console.log(`Created test booking in future: ID ${booking.id}, Date: ${booking.date}, OTP: ${booking.otp}`);

    // Try completing the booking with INCORRECT OTP
    console.log('Attempting completion with incorrect OTP...');
    const completeIncorrectOtp = await request('PUT', `/api/vendor/tasks/${booking.id}/complete`, 
      { otp: '1111' },
      { 'Authorization': `Bearer ${vendorToken}` }
    );
    console.log('Incorrect OTP Response:', completeIncorrectOtp.statusCode, completeIncorrectOtp.body);
    if (completeIncorrectOtp.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request for incorrect OTP, got: ${completeIncorrectOtp.statusCode}`);
    }
    if (!completeIncorrectOtp.body.message.includes('Incorrect 4-digit')) {
      throw new Error(`Expected message to contain 'Incorrect 4-digit', got: ${completeIncorrectOtp.body.message}`);
    }
    console.log('Incorrect OTP check passed!');

    // Try completing with CORRECT OTP but FUTURE DATE
    console.log('Attempting completion with correct OTP but future scheduled date...');
    const completeFutureDate = await request('PUT', `/api/vendor/tasks/${booking.id}/complete`, 
      { otp: otpCode },
      { 'Authorization': `Bearer ${vendorToken}` }
    );
    console.log('Future Date Response:', completeFutureDate.statusCode, completeFutureDate.body);
    if (completeFutureDate.statusCode !== 400) {
      throw new Error(`Expected 400 Bad Request for future date completion, got: ${completeFutureDate.statusCode}`);
    }
    if (!completeFutureDate.body.message.includes('prior to the scheduled')) {
      throw new Error(`Expected message to contain 'prior to the scheduled', got: ${completeFutureDate.body.message}`);
    }
    console.log('Prior date completion check passed!');

    // 6. Test successful completion
    console.log('\n--- Testing Successful Completion (Today/Past Date + Correct OTP) ---');
    // Update the booking date to today
    const today = new Date();
    const todayStr = `${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;
    await client.query("UPDATE bookings SET date = $1 WHERE id = $2", [todayStr + ' (10:00 AM - 12:00 PM)', booking.id]);
    console.log(`Updated booking date to today: ${todayStr}`);

    console.log('Attempting completion with correct OTP and today\'s date...');
    const completeSuccess = await request('PUT', `/api/vendor/tasks/${booking.id}/complete`, 
      { otp: otpCode },
      { 'Authorization': `Bearer ${vendorToken}` }
    );
    console.log('Successful Completion Response:', completeSuccess.statusCode, completeSuccess.body);
    if (completeSuccess.statusCode !== 200) {
      throw new Error(`Expected 200 OK for successful completion, got: ${completeSuccess.statusCode}`);
    }
    if (!completeSuccess.body.success) {
      throw new Error(`Expected success field in response to be true`);
    }

    // Verify status in DB
    const finalBookingCheck = await client.query("SELECT status FROM bookings WHERE id = $1", [booking.id]);
    console.log('Booking status in DB:', finalBookingCheck.rows[0].status);
    if (finalBookingCheck.rows[0].status !== 'Completed') {
      throw new Error(`Expected booking status to be 'Completed', got: ${finalBookingCheck.rows[0].status}`);
    }

    console.log('\nSUCCESS: All OTP, date constraints, and deactivation checks verified successfully!');

    // Cleanup test data
    console.log('Cleaning up test data...');
    await client.query("DELETE FROM bookings WHERE address = 'TEST_OTP_ADDRESS'");
    await client.query("DELETE FROM vendor_services WHERE vendor_id = $1", [vendorId]);
    await client.query("DELETE FROM vendors WHERE id = $1", [vendorId]);
    await client.query("DELETE FROM users WHERE id = $1", [userId]);
    console.log('Cleanup finished.');

  } catch (err) {
    console.error('\nERROR: Validation failed:', err.message);
  } finally {
    client.release();
    process.exit(0);
  }
}

// Wait a bit to ensure server is listening if it was just started
setTimeout(runTest, 1000);
