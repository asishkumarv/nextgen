const pool = require('../config/db');

const submitEnquiry = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'Name, email, and message are required fields' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO enquiries (name, email, phone, subject, message) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, phone || null, subject || 'support', message]
    );
    
    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      enquiryId: result.rows[0].id
    });
  } catch (error) {
    console.error('Error submitting enquiry:', error);
    res.status(500).json({ message: 'Server error processing enquiry submission' });
  }
};

module.exports = {
  submitEnquiry
};
