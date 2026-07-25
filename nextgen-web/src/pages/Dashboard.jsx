import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Shield, Calendar, Wrench, Phone, Trash2, Key, CheckCircle, RefreshCw, XCircle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { getServiceIllustration } from '../utils/illustrations';

export default function Dashboard() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedBookingIds, setExpandedBookingIds] = useState({});

  const toggleExpand = (id) => {
    setExpandedBookingIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };
  const [bookingsError, setBookingsError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  const activeSubs = user?.subscriptions?.filter(s => s.status === 'Active') || [];
  
  const isServiceIncluded = (serviceTitle) => {
    if (!serviceTitle || activeSubs.length === 0) return false;
    for (const sub of activeSubs) {
      let included = sub.includedServices;
      if (typeof included === 'string') {
        try { included = JSON.parse(included); } catch(e) { included = []; }
      }
      if (!Array.isArray(included)) included = [];
      if (included.some(s => s?.toLowerCase() === serviceTitle.toLowerCase())) {
        return true;
      }
    }
    return false;
  };

  const fetchServices = async () => {
    try {
      const data = await api.get('/services');
      setServices(data || []);
    } catch (err) {
      console.error('Error fetching services on dashboard:', err);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await api.get('/bookings');
      setBookings(data || []);
      setBookingsError('');
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setBookingsError(err.message || 'Failed to retrieve bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchServices();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${bookingId}?`)) return;
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      setActionSuccess(`Booking ${bookingId} has been cancelled successfully.`);
      fetchBookings();
    } catch (err) {
      setActionError(err.message || 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel your annual slot subscription? All priority benefits will be terminated immediately.')) return;
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      await api.post('/subscription/cancel', { subscriptionId });
      setActionSuccess('Subscription cancelled successfully.');
      await refreshProfile();
      fetchBookings(); // To refresh computed prices if any
    } catch (err) {
      setActionError(err.message || 'Failed to cancel subscription.');
    } finally {
      setActionLoading(false);
    }
  };

  const activeBookings = bookings.filter((b) => b.status === 'Booked' || b.status === 'Assigned');
  const pastBookings = bookings.filter((b) => b.status === 'Completed' || b.status === 'Cancelled');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="dashboard-page container">
      {/* Dashboard Header */}
      <div className="dashboard-header-row">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Manage your account profile, subscriptions, and repairs.</p>
        </div>
        <button onClick={() => { setLoading(true); fetchBookings(); refreshProfile(); }} className="btn btn-secondary btn-icon-only" title="Refresh Dashboard">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Action Notification Banners */}
      {actionSuccess && <div className="banner success-banner"><CheckCircle size={18} /> <span>{actionSuccess}</span></div>}
      {actionError && <div className="banner error-banner"><AlertCircle size={18} /> <span>{actionError}</span></div>}

      {/* Welcome User Banner */}
      <div className="profile-card glass-card" style={{ marginBottom: '24px', padding: '24px' }}>
        <h2 className="welcome-title text-gradient" style={{ fontSize: '1.8rem', fontWeight: '800', margin: 0 }}>
          Welcome, {user?.name}!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>{user?.phone}</p>
      </div>

      {/* Services Grid Card on TOP */}
      <div className="bookings-section glass-card" style={{ marginBottom: '24px' }}>
        <h3>Book a Service</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
          Choose from our expert on-demand electrical services.
        </p>
        <div className="services-list-grid">
          {services.map((service) => {
            const isIncluded = isServiceIncluded(service.title);
            return (
              <div 
                key={service.id} 
                className="service-selection-card glass-card clickable animate-fade-in"
                onClick={() => setSelectedService(service)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px' }}
              >
                <div className="web-grid-icon-wrapper" style={{ margin: '0 0 10px 0' }}>
                  <img 
                    src={getServiceIllustration(service.title, service.icon)} 
                    alt={service.title} 
                    className="web-grid-illustration-img"
                  />
                </div>
                <div className="web-grid-details" style={{ width: '100%', textAlign: 'center' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: '800' }}>{service.title}</h4>
                </div>
                <div className="card-footer-row" style={{ marginTop: 'auto', justifyContent: 'center', width: '100%' }}>
                  <span className="price-tag" style={{ fontSize: '0.95rem' }}>
                    {isIncluded ? (
                      <>
                        <span className="original-price" style={{ textDecoration: 'line-through', marginRight: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          ₹{service.price}
                        </span>
                        <span className="free-price" style={{ color: '#4ADE80', fontWeight: '800' }}>₹0.00 Free</span>
                      </>
                    ) : (
                      `₹${service.price}`
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Side: Subscription status */}
        <div className="dashboard-sidebar">

          {/* Subscription Info Card */}
          <div className="subscription-card glass-card">
            <div className="sub-card-header">
              <Shield className="sub-icon text-gradient" size={24} />
              <h3>Priority Care Slots</h3>
            </div>
            {(() => {
              const lastSub = user?.subscriptions && user.subscriptions.length > 0
                ? user.subscriptions[user.subscriptions.length - 1]
                : null;
              if (lastSub) {
                return (
                  <div style={{ marginBottom: '16px' }}>
                    {lastSub.status === 'Pending' ? (
                      <div className="active-sub-info animate-fade-in pending-sub-info">
                        <div className="sub-badge pending-badge">PENDING APPROVAL</div>
                        <p className="plan-name">{lastSub.plan}</p>
                        <p className="sub-upsell-text pending-upsell-text" style={{ marginTop: '10px', marginBottom: '15px' }}>
                          Your subscription request is currently pending admin approval.
                        </p>
                        
                        <div className="sub-meta-grid">
                          <div className="meta-box" style={{ gridColumn: '1 / -1' }}>
                            <span className="m-label">Subscription ID</span>
                            <span className="m-value">{lastSub.id}</span>
                          </div>
                          <div className="meta-box">
                            <span className="m-label">Region Code</span>
                            <span className="m-value">{lastSub.districtName} / {lastSub.mandalName}</span>
                          </div>
                          <div className="meta-box">
                            <span className="m-label">Event Category</span>
                            <span className="m-value">{lastSub.eventName}</span>
                          </div>
                          <div className="meta-box">
                            <span className="m-label">Slot Number</span>
                            <span className="m-value">#{lastSub.slotNumber}</span>
                          </div>
                          <div className="meta-box">
                            <span className="m-label">Payment Mode</span>
                            <span className="m-value" style={{textTransform: 'capitalize'}}>{lastSub.paymentMode}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCancelSubscription(lastSub.id)}
                          disabled={actionLoading}
                          className="btn btn-danger-outline btn-block btn-cancel-sub"
                        >
                          Cancel Request
                        </button>
                      </div>
                    ) : lastSub.status === 'Rejected' ? (
                      <div className="inactive-sub-info" style={{ marginBottom: 0 }}>
                        <p className="no-sub-text" style={{ color: '#DC2626' }}>
                          Your subscription request for slot #{lastSub.slotNumber} was rejected.
                          {lastSub.remark && <><br/><span style={{fontSize: '0.9rem', display: 'inline-block', marginTop: '4px'}}>Reason: {lastSub.remark}</span></>}
                        </p>
                        <p className="sub-upsell-text">Please contact support or try booking another slot.</p>
                      </div>
                    ) : (
                      <div className="active-sub-info animate-fade-in">
                        <div className="sub-badge">ACTIVE PLAN</div>
                        <p className="plan-name">{lastSub.plan}</p>
                        
                        <div className="sub-meta-grid">
                          <div className="meta-box" style={{ gridColumn: '1 / -1' }}>
                            <span className="m-label">Subscription ID</span>
                            <span className="m-value">{lastSub.id}</span>
                          </div>
                          <div className="meta-box">
                            <span className="m-label">Region Code</span>
                            <span className="m-value">{lastSub.districtName} / {lastSub.mandalName}</span>
                          </div>
                          <div className="meta-box">
                            <span className="m-label">Event Category</span>
                            <span className="m-value">{lastSub.eventName}</span>
                          </div>
                          <div className="meta-box">
                            <span className="m-label">Slot Number</span>
                            <span className="m-value">#{lastSub.slotNumber}</span>
                          </div>
                          <div className="meta-box">
                            <span className="m-label">Valid Until</span>
                            <span className="m-value">{formatDate(lastSub.validTill)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div className="inactive-sub-info">
                    <p className="no-sub-text">You don't have any active subscription slots.</p>
                    <p className="sub-upsell-text">Subscribe to an annual slot in your region to unlock unlimited free bookings, priority dispatch, and workload-balanced vendor routing.</p>
                    <Link to="/slots" className="btn btn-primary btn-block">
                      <Calendar size={16} />
                      <span>Choose Slot & Subscribe</span>
                    </Link>
                  </div>
                );
              }
            })()}
            
            {user?.subscriptions && user.subscriptions.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <Link to="/slots" className="btn btn-primary btn-block">
                  <Calendar size={16} />
                  <span>Book Another Slot</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Bookings and History */}
        <div className="dashboard-content">
          {/* Active Bookings */}
          <div className="bookings-section glass-card">
            <h3>Active Service Requests</h3>
            {loading ? (
              <div className="section-loading">Fetching bookings...</div>
            ) : bookingsError ? (
              <div className="section-error">{bookingsError}</div>
            ) : activeBookings.length === 0 ? (
              <div className="empty-bookings-box">
                <Wrench size={32} className="empty-icon" />
                <p>No active service bookings found.</p>
                <Link to="/services" className="btn btn-primary">Book a Service</Link>
              </div>
            ) : (
              <div className="bookings-list">
                {activeBookings.map((booking) => {
                  const isExpanded = !!expandedBookingIds[booking.id];
                  return (
                    <div key={booking.id} className={`booking-card compact-card animate-fade-in ${isExpanded ? 'is-expanded' : ''}`}>
                      <div className="booking-card-header clickable" onClick={() => toggleExpand(booking.id)}>
                        <div className="header-main-info">
                          <Wrench size={18} className="header-status-icon" />
                          <div>
                            <h4>{booking.serviceName}</h4>
                            <span className="booking-id">ID: {booking.id} • {booking.date.split(' (')[0]}</span>
                          </div>
                        </div>
                        <div className="header-side-info">
                          <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                            {booking.status}
                          </span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="booking-card-expandable-content animate-slide-down">
                          <div className="booking-card-body">
                            <div className="info-row">
                              <span className="lbl">Detailed Schedule</span>
                              <span className="val">{booking.date}</span>
                            </div>
                            <div className="info-row">
                              <span className="lbl">Address</span>
                              <span className="val">{booking.address}</span>
                            </div>
                            <div className="info-row">
                              <span className="lbl">Price Charged</span>
                              <span className="val price-val">
                                {parseFloat(booking.price) === 0 ? 'Free (Subscribed)' : `₹${booking.price}`}
                              </span>
                            </div>
                            
                            {/* OTP Block */}
                            {booking.otp && (
                              <div className="otp-box">
                                <Key size={14} className="otp-icon" />
                                <span>Completion OTP: <strong>{booking.otp}</strong></span>
                              </div>
                            )}

                            {/* Vendor details if assigned */}
                            {booking.vendorName ? (
                              <div className="vendor-info-box">
                                <h5 className="vendor-title">Assigned Technician</h5>
                                <div className="vendor-details">
                                  <span className="vendor-name">{booking.vendorName}</span>
                                  {booking.vendorPhone && (
                                    <a href={`tel:${booking.vendorPhone}`} className="vendor-phone-link">
                                      <Phone size={12} />
                                      <span>{booking.vendorPhone}</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="vendor-unassigned-box">
                                <Info size={14} />
                                <span>Technician assignment in progress...</span>
                              </div>
                            )}
                          </div>

                          {booking.status !== 'Completed' && (
                            <div className="booking-card-footer">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelBooking(booking.id);
                                }}
                                disabled={actionLoading}
                                className="btn btn-danger-link"
                              >
                                <Trash2 size={14} />
                                <span>Cancel Booking</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>


          {/* Bookings History */}
          <div className="bookings-section glass-card history-section">
            <h3>Past History</h3>
            {loading ? (
              <div className="section-loading">Fetching history...</div>
            ) : pastBookings.length === 0 ? (
              <div className="empty-history">No history records found.</div>
            ) : (
              <div className="bookings-list">
                {pastBookings.map((booking) => {
                  const isExpanded = !!expandedBookingIds[booking.id];
                  const statusIcon = booking.status === 'Completed'
                    ? <CheckCircle size={18} className="header-status-icon icon-success" />
                    : <XCircle size={18} className="header-status-icon icon-danger" />;
                  
                  return (
                    <div key={booking.id} className={`booking-card compact-card animate-fade-in ${isExpanded ? 'is-expanded' : ''}`}>
                      <div className="booking-card-header clickable" onClick={() => toggleExpand(booking.id)}>
                        <div className="header-main-info">
                          {statusIcon}
                          <div>
                            <h4>{booking.serviceName}</h4>
                            <span className="booking-id">ID: {booking.id} • {booking.date.split(' (')[0]}</span>
                          </div>
                        </div>
                        <div className="header-side-info">
                          <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                            {booking.status}
                          </span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="booking-card-expandable-content animate-slide-down">
                          <div className="booking-card-body">
                            <div className="info-row">
                              <span className="lbl">Detailed Schedule</span>
                              <span className="val">{booking.date}</span>
                            </div>
                            <div className="info-row">
                              <span className="lbl">Address</span>
                              <span className="val">{booking.address}</span>
                            </div>
                            <div className="info-row">
                              <span className="lbl">Price Charged</span>
                              <span className="val price-val">
                                {parseFloat(booking.price) === 0 ? 'Free (Subscribed)' : `₹${booking.price}`}
                              </span>
                            </div>

                            {/* Vendor details if assigned */}
                            {booking.vendorName && (
                              <div className="vendor-info-box">
                                <h5 className="vendor-title">Serviced By</h5>
                                <div className="vendor-details">
                                  <span className="vendor-name">{booking.vendorName}</span>
                                  {booking.vendorPhone && (
                                    <span className="vendor-phone-link text-muted">
                                      <Phone size={12} />
                                      <span>{booking.vendorPhone}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Details Modal */}
      {selectedService && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="modal-content glass-card animate-scale-in" style={{
            width: '100%',
            maxWidth: '450px',
            padding: '24px',
            position: 'relative',
            backgroundColor: 'var(--bg-secondary)',
            border: '1.5px solid var(--border-color)',
            borderRadius: '24px'
          }}>
            {/* Close Button */}
            <button onClick={() => setSelectedService(null)} style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}>
              <XCircle size={24} />
            </button>

            {/* Illustration Hero */}
            <div style={{
              height: '180px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <img 
                src={getServiceIllustration(selectedService.title, selectedService.icon)}
                alt={selectedService.title}
                style={{ maxHeight: '140px', objectFit: 'contain' }}
              />
            </div>

            {/* Price */}
            <div style={{ marginBottom: '12px' }}>
              {isServiceIncluded(selectedService.title) ? (
                <span style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'inline-block'
                }}>
                  FREE — Covered by subscription
                </span>
              ) : (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  backgroundColor: 'var(--bg-primary)',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: '1.5px solid var(--primary)'
                }}>
                  <span style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.4rem' }}>₹{selectedService.price}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '4px' }}>/ visit</span>
                </div>
              )}
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {selectedService.title}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '20px' }}>
              {selectedService.subtitle || selectedService.description || 'Professional electrical repair and troubleshooting support.'}
            </p>

            {/* Book Button */}
            <button 
              onClick={() => {
                navigate('/services', { state: { preSelectedService: selectedService } });
                setSelectedService(null);
              }}
              style={{
                width: '100%',
                backgroundColor: 'var(--primary)',
                color: 'var(--bg-primary)',
                fontWeight: '900',
                fontSize: '1rem',
                padding: '14px',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Calendar size={18} />
              <span>Book This Service</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
