const twilio = require('twilio');

/**
 * Send SMS OTP via Twilio
 * @param {string} toPhone Phone number (e.g., "9876543210" or "+919876543210")
 * @param {string} otp 6-digit OTP code
 */
const sendSmsOtp = async (toPhone, otp) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const mainAccountSid = process.env.TWILIO_MAIN_ACCOUNT_SID;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || accountSid.includes('your_twilio') || !twilioPhoneNumber || twilioPhoneNumber.includes('your_twilio')) {
    console.log(`\n======================================================`);
    console.log(`[TWILIO DEMO MODE] OTP for ${toPhone} is: ${otp}`);
    console.log(`To enable live SMS, set TWILIO_PHONE_NUMBER in backend/.env`);
    console.log(`======================================================\n`);
    return true;
  }

  let client;
  try {
    if (accountSid.startsWith('SK') && mainAccountSid) {
      client = twilio(accountSid, authToken, { accountSid: mainAccountSid });
    } else {
      client = twilio(accountSid, authToken);
    }
  } catch (err) {
    console.error('[Twilio Initialization Error]', err.message);
    throw new Error(`Twilio Client Initialization Failed: ${err.message}`);
  }

  // Format phone number to E.164 standard (e.g. +91XXXXXXXXXX)
  let formattedPhone = String(toPhone).trim().replace(/[^\d+]/g, '');
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+91${formattedPhone}`; // Default country code India (+91)
  }

  try {
    const message = await client.messages.create({
      body: `Your Go Fixit verification code is: ${otp}. Valid for 10 minutes.`,
      from: twilioPhoneNumber,
      to: formattedPhone
    });
    console.log(`[Twilio SMS] OTP sent to ${formattedPhone} (SID: ${message.sid})`);
    return true;
  } catch (error) {
    console.error('[Twilio SMS Error] Failed to send SMS:', error.message);
    throw new Error(`SMS delivery failed: ${error.message}`);
  }
};

module.exports = { sendSmsOtp };
