const pool = require('../config/db');

const bookSlot = async (req, res) => {
  const { districtId, mandalId, eventId, slotNumber, paymentMode, transactionId, screenshotUrl } = req.body;
  const userId = req.user.id;

  if (!districtId || !mandalId || !eventId || !slotNumber) {
    return res.status(400).json({ message: 'Please select a District, Mandal, Event, and Slot' });
  }

  if (paymentMode === 'online' && (!transactionId || !screenshotUrl)) {
    return res.status(400).json({ message: 'Transaction ID and screenshot are required for online payments' });
  }

  try {
    // Check if user already has an active or pending subscription
    const userSubCheck = await pool.query("SELECT * FROM subscriptions WHERE user_id = $1 AND status != 'Rejected'", [userId]);
    if (userSubCheck.rows.length > 0) {
      return res.status(400).json({ message: 'You already have an active or pending subscription' });
    }

    // Verify Event exists and belongs to Mandal
    const eventRes = await pool.query('SELECT * FROM events WHERE id = $1 AND mandal_id = $2', [eventId, mandalId]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ message: 'Selected Event not found in this Mandal' });
    }
    const event = eventRes.rows[0];

    // Check if slot number is configured for this event
    const configuredSlots = event.slots.split(',').map(s => s.trim());
    if (!configuredSlots.includes(String(slotNumber).trim())) {
      return res.status(400).json({ message: `Slot #${slotNumber} is not available for ${event.event_name}` });
    }

    // Check if slot number is already taken for this event
    const slotCheck = await pool.query(
      "SELECT * FROM subscriptions WHERE event_id = $1 AND slot_number = $2 AND status != 'Rejected'",
      [eventId, slotNumber]
    );
    if (slotCheck.rows.length > 0) {
      return res.status(400).json({ message: `Slot #${slotNumber} is already booked for this event` });
    }

    // Generate random Subscription ID
    const randomId = `NGPC-${Math.floor(100000 + Math.random() * 900000)}`;
    const plan = `Annual · ₹${parseInt(event.price)}/year`;
    const price = parseFloat(event.price);
    
    const validTill = new Date();
    validTill.setFullYear(validTill.getFullYear() + 1); // 1 year validity

    const status = paymentMode === 'online' ? 'Pending' : 'Active'; // For now, offline is auto-active. We could make offline 'Pending' too if cash collection is verified later. Assuming offline is immediate or handled differently. Let's make everything offline 'Pending' too unless admin approves? The user said "after submitting it should refelct in the admin and admin should accept the subscription after that subscription plan should reflect to user for offline and online also". OK, both are Pending!
    
    // Clean up any previously rejected subscriptions for this user to avoid DB unique constraint conflicts
    await pool.query("DELETE FROM subscriptions WHERE user_id = $1 AND status = 'Rejected'", [userId]);

    // Insert subscription
    const newSub = await pool.query(
      `INSERT INTO subscriptions (id, user_id, district_id, mandal_id, event_id, event_name, slot_number, plan, price, payment_mode, transaction_id, screenshot_url, status, valid_till) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [randomId, userId, districtId, mandalId, eventId, event.event_name, slotNumber, plan, price, paymentMode || 'offline', transactionId || null, screenshotUrl || null, 'Pending', validTill]
    );

    res.status(201).json({
      success: true,
      subscription: {
        id: newSub.rows[0].id,
        slotNumber: newSub.rows[0].slot_number,
        plan: newSub.rows[0].plan,
        price: newSub.rows[0].price,
        status: newSub.rows[0].status,
        validTill: newSub.rows[0].valid_till
      }
    });

  } catch (error) {
    console.error('Error booking slot:', error);
    res.status(500).json({ message: 'Server error booking subscription slot' });
  }
};

const cancelSlot = async (req, res) => {
  const userId = req.user.id;

  try {
    // Delete user subscription
    const deleteRes = await pool.query('DELETE FROM subscriptions WHERE user_id = $1 RETURNING *', [userId]);
    
    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ message: 'No active subscription found to cancel' });
    }

    res.json({
      success: true,
      message: 'Subscription slot canceled successfully'
    });

  } catch (error) {
    console.error('Error canceling slot:', error);
    res.status(500).json({ message: 'Server error canceling subscription slot' });
  }
};

const getBookedSlots = async (req, res) => {
  const eventId = req.query.eventId;
  try {
    let result;
    if (eventId) {
      result = await pool.query("SELECT slot_number FROM subscriptions WHERE event_id = $1 AND status != 'Rejected'", [eventId]);
    } else {
      result = await pool.query("SELECT slot_number FROM subscriptions WHERE status != 'Rejected'");
    }
    const bookedSlotsList = result.rows.map(row => row.slot_number);
    res.json({ bookedSlots: bookedSlotsList });
  } catch (error) {
    console.error('Error getting booked slots list:', error);
    res.status(500).json({ message: 'Server error retrieving booked slots' });
  }
};

const getDistricts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM districts ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting districts:', error);
    res.status(500).json({ message: 'Server error retrieving districts' });
  }
};

const getMandals = async (req, res) => {
  const districtId = req.query.districtId;
  try {
    let result;
    if (districtId) {
      result = await pool.query('SELECT * FROM mandals WHERE district_id = $1 ORDER BY name ASC', [districtId]);
    } else {
      result = await pool.query('SELECT * FROM mandals ORDER BY name ASC');
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting mandals:', error);
    res.status(500).json({ message: 'Server error retrieving mandals' });
  }
};

const getEvents = async (req, res) => {
  const mandalId = req.query.mandalId;
  try {
    let result;
    if (mandalId) {
      result = await pool.query('SELECT * FROM events WHERE mandal_id = $1 ORDER BY event_name ASC', [mandalId]);
    } else {
      result = await pool.query('SELECT * FROM events ORDER BY event_name ASC');
    }
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ message: 'Server error retrieving events' });
  }
}

module.exports = {
  bookSlot,
  cancelSlot,
  getBookedSlots,
  getDistricts,
  getMandals,
  getEvents
};
