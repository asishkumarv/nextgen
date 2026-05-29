import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Award, Zap, HeartHandshake, ArrowRight, Star, Clock } from 'lucide-react';

export default function Home() {
  const { token, user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content container">
          <span className="hero-badge animate-fade-in">Introducing Priority Care v2.0</span>
          <h1 className="hero-title animate-slide-up">
            Smart Power Services, <br />
            <span className="text-gradient">Zero-Cost Scheduling</span>
          </h1>
          <p className="hero-subtitle animate-slide-up">
            NextGen PowerCare provides certified, on-demand technician routing. Book services directly or unlock unlimited free repairs with our annual subscription slots.
          </p>
          <div className="hero-actions animate-slide-up">
            {token ? (
              <>
                <Link to="/services" className="btn btn-primary">
                  <span>Book Service Now</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/slots" className="btn btn-secondary">
                  <span>View Member Slots</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/signup" className="btn btn-primary">
                  <span>Get Started Today</span>
                  <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  <span>Sign In Portal</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section className="stats-section container">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>99.9%</h3>
            <p>Technician Dispatch Rate</p>
          </div>
          <div className="stat-card">
            <h3>24/7</h3>
            <p>Emergency Power Support</p>
          </div>
          <div className="stat-card">
            <h3>0%</h3>
            <p>Booking Fee for Members</p>
          </div>
          <div className="stat-card">
            <h3>4.9/5</h3>
            <p>Customer Satisfaction Rating</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose NextGen PowerCare?</h2>
            <p>Our intelligent scheduling platform ensures premium repairs with zero delays.</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Zap size={24} className="feature-icon" />
              </div>
              <h3>Workload-Balanced Routing</h3>
              <p>Bookings are intelligently assigned to the least busy approved technician to ensure rapid dispatch and high attention to detail.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <ShieldCheck size={24} className="feature-icon" />
              </div>
              <h3>Annual Subscription Slots</h3>
              <p>Reserve an annual slot under your Mandal and Event. Logged-in subscribers automatically get free service bookings across all tasks.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Award size={24} className="feature-icon" />
              </div>
              <h3>Verified Technicians Only</h3>
              <p>Every technician undergoes strict background verification and certification check before getting admin approval on our portal.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <HeartHandshake size={24} className="feature-icon" />
              </div>
              <h3>No Hidden Pricing</h3>
              <p>View upfront service pricing from the start. Non-subscribed users pay a flat standard fee, while members pay absolutely nothing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section container">
        <div className="section-header">
          <h2>Loved by Homeowners</h2>
          <p>Read what our customers say about our reliable slot routing and service booking systems.</p>
        </div>

        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="stars">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#FFB020" color="#FFB020" />)}
            </div>
            <p className="testimonial-text">
              "Booking a ceiling fan repair took less than 2 minutes. Since I have an active subscription slot, the price was automatically set to zero. The vendor arrived on time and fixed it."
            </p>
            <div className="testimonial-author">
              <div>
                <h4>Rajesh Kumar</h4>
                <p>Mandal Slot Subscriber</p>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="stars">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#FFB020" color="#FFB020" />)}
            </div>
            <p className="testimonial-text">
              "The new web portal is extremely fast and responsive. I love that we don't have to select mandal and district every single time we book a normal service anymore. Super convenient!"
            </p>
            <div className="testimonial-author">
              <div>
                <h4>Lohitha Reddy</h4>
                <p>Regular Customer</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-banner">
        <div className="container cta-container">
          <div className="cta-text">
            <h2>Ready to experience hassle-free power care?</h2>
            <p>Create an account in seconds to secure your subscription slot or book a verified technician.</p>
          </div>
          <div className="cta-action">
            {token ? (
              <Link to="/services" className="btn btn-cta">Book Service Now</Link>
            ) : (
              <Link to="/signup" className="btn btn-cta">Register For Free</Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
