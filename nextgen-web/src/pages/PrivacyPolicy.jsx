import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="about-page container">
      <section className="about-hero text-center">
        <h1 className="about-title">Privacy <span className="text-gradient">Policy</span></h1>
        <p className="about-subtitle">
          Your privacy is important to us. Read how we protect and manage your data.
        </p>
      </section>

      <div className="about-content-grid" style={{ display: 'block', maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
        <div className="glass-card decorative-bg" style={{ padding: '30px', textAlign: 'left' }}>
          <h2 className="text-gradient" style={{ marginBottom: '15px' }}>1. Introduction</h2>
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            Welcome to NextGen PowerCare. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our application and use our services.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '15px' }}>2. Information We Collect</h2>
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            We collect personal information that you voluntarily provide to us when you register on the App, express an interest in obtaining information about us or our products and Services. This includes your name, phone number, address, and payment information.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '15px' }}>3. How We Use Your Information</h2>
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            We use personal information collected via our App for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
          </p>
          <ul style={{ marginBottom: '20px', marginLeft: '20px', lineHeight: '1.6' }}>
            <li>To facilitate account creation and logon process.</li>
            <li>To fulfill and manage your orders, payments, and service requests.</li>
            <li>To match you with our authorized vendor technicians.</li>
          </ul>

          <h2 className="text-gradient" style={{ marginBottom: '15px' }}>4. Sharing Your Information</h2>
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations. Specifically, we share relevant details (like your address and phone number) with our dispatched technicians so they can perform the requested services.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '15px' }}>5. Contact Us</h2>
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            If you have questions or comments about this notice, you may email us at privacy@nextgenpowercare.com.
          </p>
        </div>
      </div>
    </div>
  );
}
