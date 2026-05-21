const pool = require('../config/db');

const bookSlot = async (req, res) => {
  const { slotNumber } = req.body;
  const userId = req.user.id;

  if (!slotNumber) {
    return res.status(400).json({ message: 'Please select a slot number' });
  }

  try {
    // Check if user already has an active subscription
    const userSubCheck = await pool.query('SELECT * FROM subscriptions WHERE user_id = $1', [userId]);
    if (userSubCheck.rows.length > 0) {
      return res.status(400).json({ message: 'You already have an active subscription slot' });
    }

    // Check if slot number is already taken
    const slotCheck = await pool.query('SELECT * FROM subscriptions WHERE slot_number = $1', [slotNumber]);
    if (slotCheck.rows.length > 0) {
      return res.status(400).json({ message: `Slot #${slotNumber} is already booked` });
    }

    // Generate random Subscription ID
    const randomId = `NGPC-${Math.floor(100000 + Math.random() * 900000)}`;
    const plan = 'Annual · ₹2999/year';
    const price = 2999.00;
    
    const validTill = new Date();
    validTill.setFullYear(validTill.getFullYear() + 1); // 1 year validity

    // Insert subscription
    const newSub = await pool.query(
      'INSERT INTO subscriptions (id, user_id, slot_number, plan, price, valid_till) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [randomId, userId, slotNumber, plan, price, validTill]
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
  try {
    const result = await pool.query('SELECT slot_number FROM subscriptions');
    const bookedSlotsList = result.rows.map(row => row.slot_number);
    res.json({ bookedSlots: bookedSlotsList });
  } catch (error) {
    console.error('Error getting booked slots list:', error);
    res.status(500).json({ message: 'Server error retrieving booked slots' });
  }
};

module.exports = {
  bookSlot,
  cancelSlot,
  getBookedSlots
};
