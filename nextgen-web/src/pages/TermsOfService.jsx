import React from 'react';
import { ShieldCheck, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="about-page container">
      <section className="about-hero text-center">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', background: 'rgba(240, 195, 142, 0.1)', border: '1px solid rgba(240, 195, 142, 0.25)', marginBottom: '16px' }}>
          <ShieldCheck size={16} color="var(--primary)" />
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Nextgen Power Care Private Limited
          </span>
        </div>
        <h1 className="about-title">Terms of <span className="text-gradient">Service</span></h1>
        <p className="about-subtitle">
          Go Fixit is an official brand owned and operated by Nextgen Power Care Private Limited.
        </p>
      </section>

      <div className="about-content-grid" style={{ display: 'block', maxWidth: '860px', margin: '0 auto', paddingBottom: '60px' }}>
        <div className="glass-card decorative-bg" style={{ padding: '36px', textAlign: 'left', lineHeight: '1.7' }}>
          
          {/* Corporate Declaration Banner */}
          <div style={{ padding: '18px 22px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-color)', marginBottom: '30px' }}>
            <p style={{ margin: 0, fontSize: '14.5px', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--primary)' }}>Corporate Notice: </strong> 
              <strong>Go Fixit</strong> is a registered trademark and commercial brand operated exclusively by <strong>Nextgen Power Care Private Limited</strong> (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). All services, contractual agreements, user consents, dispatches, and monetary transactions executed through this platform are legally governed and administered under <strong>Nextgen Power Care Private Limited</strong>.
            </p>
          </div>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>1. Corporate Undertaking &amp; Acceptance of Terms</h2>
          <p style={{ marginBottom: '22px', color: 'var(--text-secondary)' }}>
            By downloading, browsing, registering, or booking any service through the Go Fixit website or mobile applications, you enter into a legally binding contract with <strong>Nextgen Power Care Private Limited</strong>. If you do not agree with any provision of these Terms of Service, you must discontinue platform use immediately.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>2. User Oath, Affirmation &amp; Solemn Consent</h2>
          <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
            By engaging with Go Fixit, you solemnly take oath, affirm, and provide unequivocal consent to <strong>Nextgen Power Care Private Limited</strong> regarding the following:
          </p>
          <ul style={{ marginBottom: '24px', paddingLeft: '22px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li>
              <strong>Legal Competency:</strong> You affirm that you are at least 18 years of age and hold the full legal capacity to enter into binding covenants under the Indian Contract Act, 1872.
            </li>
            <li>
              <strong>Truthfulness of Information:</strong> You solemnly declare that all information furnished (including full name, phone number, address, and premises details) is authentic, accurate, and up to date.
            </li>
            <li>
              <strong>Premises Access Consent:</strong> You grant direct consent to Nextgen Power Care Private Limited and its verified technician partners to visit your registered service premises to diagnose, execute, and verify the requested electrical or power care tasks.
            </li>
            <li>
              <strong>Workplace Safety &amp; Non-Interference:</strong> You agree to provide a safe, hazard-free environment for dispatched personnel and treat all service professionals with dignity and mutual respect.
            </li>
          </ul>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>3. Annual Priority Subscription Slots</h2>
          <p style={{ marginBottom: '22px', color: 'var(--text-secondary)' }}>
            Nextgen Power Care Private Limited offers premium subscription slots under the Go Fixit brand. Holding an active subscription slot entitles the registered customer to expedited technician dispatch, priority queue placement, and waiver of standard booking consultation charges for covered service categories during the active subscription period. Subscription rights are non-transferable and tied to the registered user account.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>4. Payment Terms &amp; Financial Security</h2>
          <p style={{ marginBottom: '22px', color: 'var(--text-secondary)' }}>
            All financial transactions initiated on Go Fixit are processed through RBI-authorized payment aggregators (such as Razorpay) directly on behalf of <strong>Nextgen Power Care Private Limited</strong>. Prices for on-demand services, spare components, and subscription slots are displayed transparently in Indian National Rupees (INR) inclusive of applicable goods and services taxes (GST).
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>5. Technician Dispatch, Verification &amp; OTP Protocol</h2>
          <p style={{ marginBottom: '22px', color: 'var(--text-secondary)' }}>
            Nextgen Power Care Private Limited utilizes an automated balancing dispatch engine to assign nearby verified technical vendors. For your safety and security, every service engagement is protected by a secure One-Time Password (OTP) verification protocol. You must only verify and commence work once the technician verifies the OTP generated in your customer application.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>6. Cancellations, Rescheduling &amp; Refunds</h2>
          <p style={{ marginBottom: '22px', color: 'var(--text-secondary)' }}>
            You may reschedule or cancel scheduled service requests prior to technician dispatch without penalty. Once a technician is dispatched or on-site, a standard visitation/inspection fee may apply. Subscription slot purchases are activated immediately upon payment and are non-refundable, except where required by statutory consumer regulations.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>7. Limitation of Liability</h2>
          <p style={{ marginBottom: '22px', color: 'var(--text-secondary)' }}>
            While Nextgen Power Care Private Limited enforces rigorous background verification, skill assessments, and safety standards for all associated technicians, the Company shall not be held liable for indirect, incidental, or consequential damages resulting from pre-existing faulty electrical wiring, unauthorized third-party tampering, or force majeure events.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>8. Governing Law &amp; Jurisdiction</h2>
          <p style={{ marginBottom: '22px', color: 'var(--text-secondary)' }}>
            These Terms and any dispute or claim arising out of or in connection with them shall be governed by and construed in accordance with the laws of the Republic of India. The courts of Andhra Pradesh (Machilipatnam / Krishna District) shall have exclusive jurisdiction over all disputes arising hereunder.
          </p>

          <h2 className="text-gradient" style={{ marginBottom: '14px', fontSize: '1.35rem' }}>9. Corporate Redressal &amp; Contact Details</h2>
          <p style={{ marginBottom: '14px', color: 'var(--text-secondary)' }}>
            For legal inquiries, dispute escalations, or service grievances, please contact our corporate desk:
          </p>
          <div style={{ padding: '16px 20px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <p style={{ margin: '0 0 6px 0', fontWeight: '600', color: 'var(--text-primary)' }}>Nextgen Power Care Private Limited</p>
            <p style={{ margin: '0 0 4px 0' }}>Brand: Go Fixit</p>
            <p style={{ margin: '0 0 4px 0' }}>Email: <a href="mailto:nextgenpowercarenpc@gmail.com" style={{ color: 'var(--primary)' }}>nextgenpowercarenpc@gmail.com</a></p>
            <p style={{ margin: '0 0 4px 0' }}>Phone / Helpline: +91 9703054527</p>
            <p style={{ margin: 0 }}>Registered Address: 1/57, Kalekanpet, Jalalpet, Machilipatnam, Andhra Pradesh, 521004, India.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
