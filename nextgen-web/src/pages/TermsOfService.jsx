import React from 'react';

export default function TermsOfService() {
  return (
    <div className="about-page container">
      <section className="about-hero text-center">
        <h1 className="about-title">Terms of <span className="text-gradient">Service</span></h1>
        <p className="about-subtitle">
          Please read these terms carefully before using our platform.
        </p>
      </section>

      <div className="about-content-grid" style={{ display: 'block', maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
        <div className="glass-card decorative-bg" style={{ padding: '30px', textAlign: 'left' }}>
          <h2 className="text-gradient" style={{ marginBottom: '15px' }}>1. Acceptance of Terms</h2>
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            By accessing or using NextGen PowerCare, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, then you may not access our service.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '15px' }}>2. Subscription and Booking</h2>
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            Our platform allows you to book electrical services and purchase subscription slots. Booking a slot gives you priority access and waives booking fees. All payments are non-refundable unless explicitly stated otherwise.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '15px' }}>3. User Responsibilities</h2>
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. You agree to provide accurate, current, and complete information during the registration process.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '15px' }}>4. Technician Services</h2>
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            NextGen PowerCare acts as an intermediary connecting you with independent technicians. While we verify our technicians, we are not directly liable for the physical work performed on your premises. Any disputes regarding the physical work should be addressed directly with the technician or through our dispute resolution center.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '15px' }}>5. Changes to Terms</h2>
          <p style={{ marginBottom: '20px', lineHeight: '1.6' }}>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any significant changes.
          </p>
        </div>
      </div>
    </div>
  );
}
