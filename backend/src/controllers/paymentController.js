const Razorpay = require('razorpay');
const crypto = require('crypto');

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_Taem2JpBTkElnV';
  const key_secret = process.env.RAZORPAY_KEY_SECRET || 'PJRUm6fIvqo2otN5DEITSr4G';

  return new Razorpay({
    key_id,
    key_secret
  });
};

const createOrder = async (req, res) => {
  const { amount, receipt, notes } = req.body;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ message: 'Invalid payment amount' });
  }

  try {
    const razorpay = getRazorpayInstance();
    const amountInPaise = Math.round(parseFloat(amount) * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: receipt || `rec_${Date.now()}`,
      notes: notes || {}
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_Taem2JpBTkElnV'
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ 
      message: 'Failed to create Razorpay payment order', 
      error: error.message || error 
    });
  }
};

const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Missing required Razorpay payment verification details' });
  }

  try {
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'PJRUm6fIvqo2otN5DEITSr4G';
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Verification failed.'
      });
    }
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ message: 'Server error during payment verification' });
  }
};

const getRazorpayKey = (req, res) => {
  res.json({
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_Taem2JpBTkElnV'
  });
};

module.exports = {
  createOrder,
  verifyPayment,
  getRazorpayKey
};
