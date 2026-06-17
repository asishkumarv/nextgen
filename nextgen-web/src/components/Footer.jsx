import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, Phone, MapPin } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logoImg} alt="NextGen Logo" className="logo-img" />
              <span>NextGen <span className="logo-accent">PowerCare</span></span>
            </div>
            <p className="footer-desc">
              State-of-the-art power system solutions, subscription-based slot booking, and priority technician routing. Serving you 24/7 with reliability and transparency.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-links-col">
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact Support</Link></li>
            </ul>
          </div>

          {/* Customer Portal */}
          <div className="footer-links-col">
            <h3>Customer Portal</h3>
            <ul>
              <li><Link to="/dashboard">My Dashboard</Link></li>
              <li><Link to="/services">Book a Service</Link></li>
              <li><Link to="/slots">Subscription Slots</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer-contact">
            <h3>Contact Us</h3>
            <div className="contact-item">
              <Phone size={16} className="contact-icon" />
              <span>9703054527</span>
            </div>
            <div className="contact-item">
              <Mail size={16} className="contact-icon" />
              <span>nextgenpowecarenpc@gmail.com</span>
            </div>
            <div className="contact-item">
              <MapPin size={16} className="contact-icon" />
              <span>1/57,kalekanpet,jalalpet, machilipatnam, andhra Pradesh,521004,india.</span>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p>&copy; {new Date().getFullYear()} NextGen PowerCare. All rights reserved.</p>
          <div className="footer-legal">
            <Link to="/terms-of-service">Terms of Service</Link>
            <span className="bullet">&bull;</span>
            <Link to="/privacy-policy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
