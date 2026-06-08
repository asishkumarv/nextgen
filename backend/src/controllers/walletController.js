const pool = require('../config/db');

// Get wallet and referral stats
const getWalletStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get wallet balance and code
    const userRes = await pool.query('SELECT wallet_balance, referral_code FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
    const { wallet_balance, referral_code } = userRes.rows[0];

    // Get direct referrals
    const directReferralsRes = await pool.query('SELECT name, created_at FROM users WHERE referred_by = $1 ORDER BY created_at ASC', [userId]);
    const referralRewards = [200, 230, 260, 290, 320, 350, 380, 410, 450, 500];
    
    const directReferrals = directReferralsRes.rows.map((ref, index) => {
      const amount = index < referralRewards.length ? referralRewards[index] : 500;
      return { ...ref, type: 'Direct', amount };
    });

    // Get indirect (sub) referrals
    const indirectReferralsRes = await pool.query(`
      SELECT u2.name, u2.created_at 
      FROM users u1
      JOIN users u2 ON u2.referred_by = u1.id
      WHERE u1.referred_by = $1
      ORDER BY u2.created_at ASC
    `, [userId]);

    const indirectReferrals = indirectReferralsRes.rows.map(ref => ({
      ...ref, type: 'Indirect', amount: 100
    }));

    // Combine and sort by date descending
    const referrals = [...directReferrals, ...indirectReferrals].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Get withdrawals
    const withdrawalsRes = await pool.query('SELECT id, amount, status, created_at FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    const withdrawals = withdrawalsRes.rows;

    res.json({
      walletBalance: wallet_balance,
      referralCode: referral_code,
      referrals,
      withdrawals
    });
  } catch (err) {
    console.error('Error fetching wallet stats:', err);
    res.status(500).json({ message: 'Server error fetching wallet stats' });
  }
};

// Request Withdrawal
const requestWithdrawal = async (req, res) => {
  const { accountName, accountNumber, ifscCode, amount } = req.body;
  const userId = req.user.id;

  if (!accountName || !accountNumber || !ifscCode || !amount) {
    return res.status(400).json({ message: 'All banking details and amount are required' });
  }

  if (amount < 100) {
    return res.status(400).json({ message: 'Minimum withdrawal amount is ₹100' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const userRes = await client.query('SELECT wallet_balance FROM users WHERE id = $1 FOR UPDATE', [userId]);
    const currentBalance = parseFloat(userRes.rows[0].wallet_balance);

    if (currentBalance < amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Deduct balance
    await client.query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [amount, userId]);

    // Create withdrawal request
    const withdrawRes = await client.query(
      'INSERT INTO withdrawals (user_id, account_name, account_number, ifsc_code, amount, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, accountName, accountNumber, ifscCode, amount, 'Pending']
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Withdrawal requested successfully', data: withdrawRes.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error requesting withdrawal:', err);
    res.status(500).json({ message: 'Server error processing withdrawal' });
  } finally {
    client.release();
  }
};

module.exports = {
  getWalletStats,
  requestWithdrawal
};
