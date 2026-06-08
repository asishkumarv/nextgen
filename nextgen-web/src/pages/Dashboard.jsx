import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Shield, Calendar, Wrench, Phone, Trash2, Key, CheckCircle, RefreshCw, XCircle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function Dashboard() {
  const { user, refreshProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
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

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your annual slot subscription? All priority benefits will be terminated immediately.')) return;
    setActionLoading(true);
    setActionError('');
    setActionSuccess('');
    try {
      await api.post('/subscription/cancel');
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

      <div className="dashboard-grid">
        {/* Left Side: Profile & Subscription status */}
        <div className="dashboard-sidebar">
          {/* User Profile Info */}
          <div className="profile-card glass-card">
            <h3>Customer Profile</h3>
            <div className="profile-details">
              <div className="profile-item">
                <span className="label">Name</span>
                <span className="value">{user?.name}</span>
              </div>
              <div className="profile-item">
                <span className="label">Phone</span>
                <span className="value">{user?.phone}</span>
              </div>
              <div className="profile-item">
                <span className="label">Member Since</span>
                <span className="value">{formatDate(user?.created_at || new Date())}</span>
              </div>
            </div>
          </div>

          {/* Subscription Info Card */}
          <div className="subscription-card glass-card">
            <div className="sub-card-header">
              <Shield className="sub-icon text-gradient" size={24} />
              <h3>Priority Care Slot</h3>
            </div>
            {user?.subscription ? (
              user.subscription.status === 'Pending' ? (
                <div className="active-sub-info animate-fade-in" style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }}>
                  <div className="sub-badge" style={{ backgroundColor: '#F59E0B' }}>PENDING APPROVAL</div>
                  <p className="plan-name">{user.subscription.plan}</p>
                  <p className="sub-upsell-text" style={{ marginTop: '10px', marginBottom: '15px', color: '#B45309' }}>
                    Your subscription request is currently pending admin approval.
                  </p>
                  
                  <div className="sub-meta-grid">
                    <div className="meta-box">
                      <span className="m-label">Region Code</span>
                      <span className="m-value">{user.subscription.districtName} / {user.subscription.mandalName}</span>
                    </div>
                    <div className="meta-box">
                      <span className="m-label">Event Category</span>
                      <span className="m-value">{user.subscription.eventName}</span>
                    </div>
                    <div className="meta-box">
                      <span className="m-label">Slot Number</span>
                      <span className="m-value">#{user.subscription.slotNumber}</span>
                    </div>
                    <div className="meta-box">
                      <span className="m-label">Payment Mode</span>
                      <span className="m-value" style={{textTransform: 'capitalize'}}>{user.subscription.paymentMode}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCancelSubscription}
                    disabled={actionLoading}
                    className="btn btn-danger-outline btn-block btn-cancel-sub"
                  >
                    Cancel Request
                  </button>
                </div>
              ) : user.subscription.status === 'Rejected' ? (
                <div className="inactive-sub-info">
                  <p className="no-sub-text" style={{ color: '#DC2626' }}>Your previous subscription request was rejected.</p>
                  <p className="sub-upsell-text">Please contact support or try booking another slot.</p>
                  <Link to="/slots" className="btn btn-primary btn-block">
                    <Calendar size={16} />
                    <span>Choose Slot & Subscribe</span>
                  </Link>
                </div>
              ) : (
                <div className="active-sub-info animate-fade-in">
                  <div className="sub-badge">ACTIVE PLAN</div>
                  <p className="plan-name">{user.subscription.plan}</p>
                  
                  <div className="sub-meta-grid">
                    <div className="meta-box">
                      <span className="m-label">Region Code</span>
                      <span className="m-value">{user.subscription.districtName} / {user.subscription.mandalName}</span>
                    </div>
                    <div className="meta-box">
                      <span className="m-label">Event Category</span>
                      <span className="m-value">{user.subscription.eventName}</span>
                    </div>
                    <div className="meta-box">
                      <span className="m-label">Slot Number</span>
                      <span className="m-value">#{user.subscription.slotNumber}</span>
                    </div>
                    <div className="meta-box">
                      <span className="m-label">Valid Until</span>
                      <span className="m-value">{formatDate(user.subscription.validTill)}</span>
                    </div>
                  </div>

                </div>
              )
            ) : (
              <div className="inactive-sub-info">
                <p className="no-sub-text">You don't have an active subscription slot.</p>
                <p className="sub-upsell-text">Subscribe to an annual slot in your region to unlock unlimited free bookings, priority dispatch, and workload-balanced vendor routing.</p>
                <Link to="/slots" className="btn btn-primary btn-block">
                  <Calendar size={16} />
                  <span>Choose Slot & Subscribe</span>
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
    </div>
  );
}
