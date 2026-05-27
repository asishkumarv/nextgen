const pool = require('../config/db');

const bookSlot = async (req, res) => {
  const { districtId, mandalId, slotNumber, eventName } = req.body;
  const userId = req.user.id;

  if (!districtId || !mandalId || !slotNumber || !eventName) {
    return res.status(400).json({ message: 'Please select a District, Mandal, Event, and Slot' });
  }

  try {
    // Check if user already has an active subscription
    const userSubCheck = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
    if (userSubCheck.rows.length > 0) {
      return res.status(400).json({ message: 'You already have an active subscription slot' });
    }

    // Verify Mandal exists
    const mandalRes = await pool.query('SELECT * FROM mandals WHERE id = $1', [mandalId]);
    if (mandalRes.rows.length === 0) {
      return res.status(404).json({ message: 'Selected Mandal not found' });
    }
    const mandal = mandalRes.rows[0];

    // Check if slot number is configured for this mandal
    const configuredSlots = mandal.slots.split(',').map(s => s.trim());
    if (!configuredSlots.includes(String(slotNumber).trim())) {
      return res.status(400).json({ message: `Slot #${slotNumber} is not available in Mandal ${mandal.name}` });
    }

    // Check if slot number is already taken in this mandal
    const slotCheck = await pool.query(
      'SELECT * FROM subscriptions WHERE mandal_id = $1 AND slot_number = $2',
      [mandalId, slotNumber]
    );
    if (slotCheck.rows.length > 0) {
      return res.status(400).json({ message: `Slot #${slotNumber} is already booked in Mandal ${mandal.name}` });
    }

    // Generate random Subscription ID
    const randomId = `NGPC-${Math.floor(100000 + Math.random() * 900000)}`;
    const plan = `Annual · ₹${parseInt(mandal.subscription_price)}/year`;
    const price = parseFloat(mandal.subscription_price);
    
    const validTill = new Date();
    validTill.setFullYear(validTill.getFullYear() + 1); // 1 year validity

    // Insert subscription
    const newSub = await pool.query(
      `INSERT INTO subscriptions (id, user_id, district_id, mandal_id, event_name, slot_number, plan, price, valid_till) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [randomId, userId, districtId, mandalId, eventName, slotNumber, plan, price, validTill]
    );

    res.status(201).json({
      success: true,
      subscription: {
        id: newSub.rows[0].id,
        slotNumber: newSub.rows[0].slot_number,
        plan: newSub.rows[0].plan,
        price: newSub.rows[0].price,
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
  const mandalId = req.query.mandalId;
  try {
    let result;
    if (mandalId) {
      result = await pool.query('SELECT slot_number FROM subscriptions WHERE mandal_id = $1', [mandalId]);
    } else {
      result = await pool.query('SELECT slot_number FROM subscriptions');
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

module.exports = {
  bookSlot,
  cancelSlot,
  getBookedSlots,
  getDistricts,
  getMandals
};
