import { api } from './api';

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const processRazorpayPayment = async ({
  amount,
  name,
  description,
  user,
  notes = {}
}) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
  }

  // 1. Create Order on Backend
  const orderData = await api.post('/payments/create-order', {
    amount,
    receipt: `receipt_${Date.now()}`,
    notes
  });

  if (!orderData || !orderData.orderId) {
    throw new Error('Failed to create payment order.');
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: orderData.keyId || 'rzp_test_Taem2JpBTkElnV',
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: name || 'GoFixit',
      description: description || 'Online Payment',
      order_id: orderData.orderId,
      prefill: {
        name: user?.name || user?.username || '',
        email: user?.email || '',
        contact: user?.phone ? user.phone.replace(/[^0-9]/g, '').slice(-10) : (user?.phoneNumber ? user.phoneNumber.replace(/[^0-9]/g, '').slice(-10) : '')
      },
      theme: {
        color: '#F1AA9B'
      },
      handler: async function (response) {
        try {
          // 2. Verify Payment on Backend
          const verifyData = await api.post('/payments/verify-payment', {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });

          if (verifyData && verifyData.success) {
            resolve({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature
            });
          } else {
            reject(new Error(verifyData?.message || 'Payment verification failed.'));
          }
        } catch (err) {
          reject(err);
        }
      },
      modal: {
        ondismiss: function () {
          reject(new Error('Payment cancelled by user.'));
        }
      }
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.on('payment.failed', function (response) {
      reject(new Error(response.error?.description || 'Payment failed. Please try again.'));
    });
    paymentObject.open();
  });
};
