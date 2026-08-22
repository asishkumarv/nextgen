const nodemailer = require('nodemailer');
const path = require('path');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'info.gofixit@gmail.com',
    pass: process.env.EMAIL_PASS || 'dvll hvts sibn yvvb'
  }
});

const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: '"Go Fixit" <info.gofixit@gmail.com>',
    to: email,
    subject: `${otp} is your Go Fixit verification code`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Go Fixit Verification Code</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #FAF6F0;
            color: #312C51;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 500px;
            margin: 40px auto;
            background-color: #FFFFFF;
            border-radius: 16px;
            border: 1px solid #E5E1D8;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(49, 44, 81, 0.05);
          }
          .header {
            background-color: #312C51;
            padding: 30px;
            text-align: center;
          }
          .logo {
            width: 70px;
            height: 70px;
            margin-bottom: 10px;
          }
          .brand-title {
            color: #FFFFFF;
            font-size: 24px;
            font-weight: 800;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          h2 {
            font-size: 20px;
            font-weight: 700;
            margin-top: 0;
            color: #312C51;
          }
          p {
            font-size: 15px;
            line-height: 1.6;
            color: #48426D;
            margin-bottom: 24px;
          }
          .otp-container {
            background: linear-gradient(135deg, rgba(240, 195, 142, 0.15) 0%, rgba(241, 170, 155, 0.15) 100%);
            border: 1.5px dashed #F1AA9B;
            border-radius: 12px;
            padding: 16px;
            margin: 24px 0;
            text-align: center;
          }
          .otp-code {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: 8px;
            color: #312C51;
            display: inline-block;
          }
          .footer {
            background-color: #FAF6F0;
            padding: 20px;
            text-align: center;
            border-top: 1px solid #E5E1D8;
            font-size: 12px;
            color: #9C9588;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <img src="cid:logo" alt="Go Fixit Logo" class="logo" />
            <h1 class="brand-title">Go Fixit</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email</h2>
            <p>Thank you for choosing Go Fixit. Use the verification code below to complete your registration process.</p>
            <div class="otp-container">
              <span class="otp-code">${otp}</span>
            </div>
            <p style="font-size: 13px; color: #9C9588; margin-bottom: 0;">This code is valid for 10 minutes. Please do not share this OTP with anyone.</p>
          </div>
          <div class="footer">
            Smart Support &bull; Go Fixit
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [{
      filename: 'GoFixit.png',
      path: path.join(__dirname, '../assets/GoFixit.png'),
      cid: 'logo'
    }]
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
