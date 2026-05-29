import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'support',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields (Name, Email, Message).');
      return;
    }
    setError('');
    setLoading(true);
    // Simulate API request
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: 'support', message: '' });
    }, 1500);
  };

  return (
    <div className="contact-page container">
      <section className="contact-hero text-center">
        <h1 className="contact-title">Get in Touch <span className="text-gradient">With Us</span></h1>
        <p className="contact-subtitle">
          Have queries about subscription slots, vendor assignment, or billing? We are here to help.
        </p>
      </section>

      <div className="contact-grid">
        {/* Contact Info Panel */}
        <div className="contact-info-panel">
          <div className="info-card glass-card">
            <h3>Customer Support</h3>
            <p>Our helpdesk is operational 24 hours a day, 7 days a week for emergency escalations.</p>

            <div className="contact-detail-items">
              <div className="detail-item">
                <Phone className="detail-icon" size={20} />
                <div>
                  <h4>Call Us</h4>
                  <p>+1 (800) 555-POWER</p>
                </div>
              </div>

              <div className="detail-item">
                <Mail className="detail-icon" size={20} />
                <div>
                  <h4>Email Us</h4>
                  <p>support@nextgenpowercare.com</p>
                </div>
              </div>

              <div className="detail-item">
                <MapPin className="detail-icon" size={20} />
                <div>
                  <h4>Corporate Office</h4>
                  <p>100 Technology Plaza, Suite 400, Silicon Valley</p>
                </div>
              </div>
            </div>
          </div>

          <div className="info-card glass-card faq-preview">
            <div className="faq-header">
              <HelpCircle className="faq-icon" size={20} />
              <h3>Quick FAQ</h3>
            </div>
            <div className="faq-item">
              <h5>How does the priority assignment work?</h5>
              <p>When you book, our backend identifies approved local vendors offering that service, checks their scheduled leaves, and assigns the task to the one with the lowest active workload.</p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="contact-form-panel">
          <div className="form-card glass-card">
            {submitted ? (
              <div className="submission-success text-center">
                <CheckCircle2 size={48} className="success-icon" />
                <h2>Message Sent!</h2>
                <p>Thank you for reaching out. A NextGen support representative will contact you via email within the next 2 hours.</p>
                <button onClick={() => setSubmitted(false)} className="btn btn-primary btn-block">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3>Send a Message</h3>
                {error && <div className="form-error-banner">{error}</div>}

                <div className="form-group">
                  <label htmlFor="name">Your Name <span className="required">*</span></label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email Address <span className="required">*</span></label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Your contact number"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="subject">What can we help you with?</label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                  >
                    <option value="support">Technical Support</option>
                    <option value="billing">Billing & Subscriptions</option>
                    <option value="vendor">Vendor Inquiries</option>
                    <option value="other">Other Inquiry</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message Content <span className="required">*</span></label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Describe your query in detail..."
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading}
                >
                  {loading ? (
                    <span>Submitting Message...</span>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
