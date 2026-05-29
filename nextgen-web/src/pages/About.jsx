import React from 'react';
import { Shield, Sparkles, Users, Award } from 'lucide-react';

export default function About() {
  return (
    <div className="about-page container">
      <section className="about-hero text-center">
        <h1 className="about-title">About <span className="text-gradient">NextGen PowerCare</span></h1>
        <p className="about-subtitle">
          Pioneering smart dispatch systems and subscription-based home care since 2024.
        </p>
      </section>

      <div className="about-content-grid">
        <div className="about-image-card">
          <div className="glass-card decorative-bg">
            <h2 className="text-gradient">Our Mission</h2>
            <p>
              To democratize access to high-quality electrical repairs and maintenance. By leveraging smart workload balancing algorithms, we match homeowners with local, verified technicians instantly, ensuring that priority problems are solved first.
            </p>
          </div>
        </div>

        <div className="about-text-content">
          <h2>Who We Are</h2>
          <p>
            NextGen PowerCare was established to address the fragmentation and delays in calling local technicians. Our automated workflow engine routes service requests dynamically depending on live vendor availability, reducing repair lead times by over 70%.
          </p>
          <p>
            For premium customers, we offer our signature subscription slots. By choosing a slot number within their Mandal and District, subscribers enjoy immediate priority service, with booking fees completely waived for a full year.
          </p>
        </div>
      </div>

      <section className="values-section">
        <h2 className="text-center section-title">Our Core Values</h2>
        <div className="values-grid">
          <div className="value-card glass-card">
            <Shield className="value-icon text-gradient" size={32} />
            <h3>Uncompromising Safety</h3>
            <p>We perform rigorous certifications and background checks on all our vendor technicians.</p>
          </div>

          <div className="value-card glass-card">
            <Sparkles className="value-icon text-gradient" size={32} />
            <h3>Innovative Dispatch</h3>
            <p>Our workload balancing algorithm routes tasks to the least busy approved vendor automatically.</p>
          </div>

          <div className="value-card glass-card">
            <Users className="value-icon text-gradient" size={32} />
            <h3>Community Centric</h3>
            <p>We empower independent technicians by assigning them fair workloads near their location.</p>
          </div>

          <div className="value-card glass-card">
            <Award className="value-icon text-gradient" size={32} />
            <h3>Absolute Transparency</h3>
            <p>Upfront prices, verified OTP check-ins, and direct vendor contact. No hidden surcharges.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
