import React from 'react';
import { Lock, ShieldCheck, Eye, Database, Mail } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="about-page container">
      <section className="about-hero text-center">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', background: 'rgba(240, 195, 142, 0.1)', border: '1px solid rgba(240, 195, 142, 0.25)', marginBottom: '16px' }}>
          <ShieldCheck size={16} color="var(--primary)" />
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Nextgen Power Care Private Limited
          </span>
        </div>
        <h1 className="about-title">Privacy <span className="text-gradient">Policy</span></h1>
        <p className="about-subtitle">
          Your privacy, data security, and trust are fundamental to Nextgen Power Care Private Limited.
        </p>
      </section>

      <div className="about-content-grid" style={{ display: 'block', maxWidth: '860px', margin: '0 auto', paddingBottom: '60px' }}>
        <div className="glass-card decorative-bg" style={{ padding: '36px', textAlign: 'left', lineHeight: '1.7' }}>

          {/* Corporate Notice */}
          <div style={{ padding: '18px 22px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', marginBottom: '30px' }}>
            <p style={{ margin: 0, fontSize: '14.5px', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--primary)' }}>Corporate Notice: </strong> 
              <strong>Go Fixit</strong> is a commercial consumer brand owned, operated, and maintained exclusively by <strong>Nextgen Power Care Private Limited</strong> (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). All data collection, user consents, privacy undertakings, and technological operations are executed by and under the legal responsibility of <strong>Nextgen Power Care Private Limited</strong>.
            </p>
          </div>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>1. Corporate Identity &amp; Scope</h2>
          <p style={{ marginBottom: '22px', color: 'var(--text-secondary)' }}>
            This Privacy Policy governs the manner in which <strong>Nextgen Power Care Private Limited</strong> collects, uses, maintains, and discloses information gathered from users across the Go Fixit web platform, mobile applications, and customer support channels. By registering, requesting services, or purchasing subscription slots, you enter into direct agreement with Nextgen Power Care Private Limited.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>2. User Oath, Affirmation &amp; Express Consent</h2>
          <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
            By creating an account or scheduling a service on Go Fixit, you solemnly take oath and provide your voluntary, informed, and explicit consent to <strong>Nextgen Power Care Private Limited</strong> to:
          </p>
          <ul style={{ marginBottom: '24px', paddingLeft: '22px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <strong>Collect &amp; Authenticate:</strong> Gather and verify your personal identifiers (such as full name, contact mobile number, email address, and demographic location) to create a verified customer profile.
            </li>
            <li>
              <strong>Process Service Location:</strong> Store and map your service address, district, mandal, and premises details for accurate technician routing and emergency electrical assistance.
            </li>
            <li>
              <strong>Authorize Technician Access:</strong> Securely share relevant contact and premises information with dispatched, background-verified technicians who have been assigned to perform your requested service.
            </li>
            <li>
              <strong>Regulatory &amp; Transactional Records:</strong> Retain records of bookings, OTP verifications, invoices, and service feedback as required by the Information Technology Act, 2000 and applicable digital data protection standards.
            </li>
          </ul>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>3. Information We Collect</h2>
          <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
            To deliver prompt, reliable electrical and power care services, Nextgen Power Care Private Limited collects:
          </p>
          <ul style={{ marginBottom: '24px', paddingLeft: '22px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Personal Credentials:</strong> Name, phone number, email address, password hash, and profile details.</li>
            <li><strong>Location &amp; Address Data:</strong> House/flat number, street, landmark, area, mandal, district, state, and pin code.</li>
            <li><strong>Service &amp; Booking Details:</strong> Scheduled slots, equipment type, service notes, and technician visit timestamps.</li>
            <li><strong>Payment Identifiers:</strong> Razorpay order ID, payment ID, transaction status, and payment mode (Note: We do not store sensitive payment card numbers, CVVs, or bank net-banking passwords).</li>
          </ul>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>4. How Nextgen Power Care Private Limited Uses Your Data</h2>
          <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
            Your information is utilized strictly for lawful business and operational functions, including:
          </p>
          <ul style={{ marginBottom: '24px', paddingLeft: '22px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>Facilitating seamless account registration, login authentication, and password management.</li>
            <li>Automating technician matching based on location proximity and workload availability.</li>
            <li>Generating secure OTPs for arrival and completion verification.</li>
            <li>Issuing GST-compliant invoices and managing subscription slot privileges.</li>
            <li>Providing prompt customer care, warranty tracking, and resolving service tickets.</li>
          </ul>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>5. Information Sharing with Authorized Technicians</h2>
          <p style={{ marginBottom: '22px', color: 'var(--text-secondary)' }}>
            To fulfill your booked services, Nextgen Power Care Private Limited securely shares necessary contact information (name, phone number, and service address) with our assigned, vetted technicians. Our technician partners are bound by strict non-disclosure, confidentiality, and code-of-conduct agreements prohibiting any unauthorized use or secondary distribution of your information.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>6. Data Protection &amp; Security Protocols</h2>
          <p style={{ marginBottom: '22px', color: 'var(--text-secondary)' }}>
            We implement industry-standard encryption (TLS/SSL in transit, hashed passwords, tokenized API authentication) and robust firewalls to safeguard your data against unauthorized access, alteration, or disclosure. All transaction workflows operate under PCI-DSS certified payment gateways (Razorpay).
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>7. Data Retention &amp; User Rights</h2>
          <p style={{ marginBottom: '22px', color: 'var(--text-secondary)' }}>
            You maintain the right to review, update, or correct your personal information via your account dashboard. You may request account deletion or data anonymization by reaching out to our Grievance Officer, subject to mandatory legal record-keeping requirements under applicable tax and financial laws.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>8. Corporate Grievance Officer &amp; Contact</h2>
          <p style={{ marginBottom: '14px', color: 'var(--text-secondary)' }}>
            If you have questions, feedback, or grievance reports regarding your privacy and personal data, please contact:
          </p>
          <div style={{ padding: '16px 20px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <p style={{ margin: '0 0 6px 0', fontWeight: '600', color: 'var(--text-primary)' }}>Grievance Officer &mdash; Nextgen Power Care Private Limited</p>
            <p style={{ margin: '0 0 4px 0' }}>Brand: Go Fixit</p>
            <p style={{ margin: '0 0 4px 0' }}>Email: <a href="mailto:nextgenpowercarenpc@gmail.com" style={{ color: 'var(--primary)' }}>nextgenpowercarenpc@gmail.com</a></p>
            <p style={{ margin: '0 0 4px 0' }}>Phone / Support: +91 9703054527</p>
            <p style={{ margin: 0 }}>Registered Address: Plot No. 47/HIG, M.C.K., Block No. 3, Kukatpally, KPHB Colony, Tirumalagiri, Hyderabad- 500085, Telangana, India.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
