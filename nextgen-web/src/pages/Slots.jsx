import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Calendar, Shield, CreditCard, CheckCircle2, ChevronRight, AlertTriangle, QrCode, Upload, Info } from 'lucide-react';
import './Slots.css';

export default function Slots() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const selectionRef = useRef(null);
  const paymentRef = useRef(null);

  // Filter States
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [events, setEvents] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedMandalId, setSelectedMandalId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Payment States
  const [paymentMode, setPaymentMode] = useState('offline'); // 'online' or 'offline'
  const [transactionId, setTransactionId] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Loading & Error States
  const [districtsLoading, setDistrictsLoading] = useState(true);
  const [mandalsLoading, setMandalsLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const activeMandal = mandals.find((m) => String(m.id) === String(selectedMandalId));
  const activeEvent = events.find((e) => String(e.id) === String(selectedEventId));

  // Fetch Districts on mount
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const data = await api.get('/subscription/districts');
        setDistricts(data || []);
      } catch (err) {
        console.error('Error fetching districts:', err);
        setError('Failed to fetch districts. Please try reloading.');
      } finally {
        setDistrictsLoading(false);
      }
    };
    fetchDistricts();
  }, []);

  // Fetch Mandals when District changes
  useEffect(() => {
    if (!selectedDistrictId) {
      setMandals([]);
      setSelectedMandalId('');
      return;
    }
    const fetchMandals = async () => {
      setMandalsLoading(true);
      try {
        const data = await api.get(`/subscription/mandals?districtId=${selectedDistrictId}`);
        setMandals(data || []);
        setSelectedMandalId('');
      } catch (err) {
        console.error('Error fetching mandals:', err);
        setError('Failed to fetch mandals.');
      } finally {
        setMandalsLoading(false);
      }
    };
    fetchMandals();
  }, [selectedDistrictId]);

  // Fetch Events when Mandal changes
  useEffect(() => {
    if (!selectedMandalId) {
      setEvents([]);
      setSelectedEventId('');
      return;
    }
    const fetchEvents = async () => {
      setEventsLoading(true);
      try {
        const data = await api.get(`/subscription/events?mandalId=${selectedMandalId}`);
        setEvents(data || []);
        setSelectedEventId('');
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to fetch events.');
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, [selectedMandalId]);

  // Fetch Booked Slots when Event changes
  useEffect(() => {
    if (!selectedEventId) {
      setBookedSlots([]);
      setSelectedSlot(null);
      return;
    }
    const fetchBookedSlots = async () => {
      setSlotsLoading(true);
      try {
        const data = await api.get(`/subscription/booked?eventId=${selectedEventId}`);
        setBookedSlots(data.bookedSlots || []);
        setSelectedSlot(null);
      } catch (err) {
        console.error('Error fetching booked slots:', err);
        setError('Failed to load reserved slots list.');
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchBookedSlots();
  }, [selectedEventId]);

  // Parse Slots for current Event
  const getEventSlots = () => {
    if (!activeEvent || !activeEvent.slots) return [];
    const parts = activeEvent.slots.split(',');
    const expanded = [];
    for (let part of parts) {
      part = part.trim();
      if (part.includes('-')) {
        const rangeParts = part.split('-');
        if (rangeParts.length === 2) {
          const start = parseInt(rangeParts[0].trim(), 10);
          const end = parseInt(rangeParts[1].trim(), 10);
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            for (let i = start; i <= end; i++) expanded.push(i);
            continue;
          }
        }
      }
      const num = parseInt(part, 10);
      if (!isNaN(num)) expanded.push(num);
    }
    return expanded;
  };

  // Effect: Scroll to top of payment section when a slot is selected
  useEffect(() => {
    if (selectedSlot && paymentRef.current) {
      setTimeout(() => {
        paymentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [selectedSlot]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB');
        return;
      }
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleBookSlot = async () => {
    if (user?.subscription && user.subscription.status !== 'Rejected') {
      setError('You already have an active subscription slot.');
      return;
    }
    if (!selectedDistrictId || !selectedMandalId || !selectedEventId || !selectedSlot) {
      setError('Please select a District, Mandal, Event, and Slot number.');
      return;
    }

    if (paymentMode === 'online') {
      if (!transactionId.trim()) {
        setError('Please enter the UPI Transaction ID.');
        return;
      }
      if (!screenshotFile) {
        setError('Please upload a screenshot of your payment.');
        return;
      }
    }

    setSubmitting(true);
    setError('');

    try {
      let screenshotUrl = null;

      if (paymentMode === 'online' && screenshotFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('image', screenshotFile);
        
        try {
          const uploadRes = await api.upload('/upload', formData);
          if (uploadRes && uploadRes.url) {
            screenshotUrl = uploadRes.url;
          } else {
            throw new Error('Image upload failed to return URL');
          }
        } catch (uploadErr) {
          throw new Error('Failed to upload screenshot. Please try again.');
        } finally {
          setUploadingImage(false);
        }
      }

      const payload = {
        districtId: parseInt(selectedDistrictId, 10),
        mandalId: parseInt(selectedMandalId, 10),
        eventId: parseInt(selectedEventId, 10),
        slotNumber: selectedSlot,
        paymentMode,
        transactionId: paymentMode === 'online' ? transactionId : null,
        screenshotUrl
      };

      await api.post('/subscription/book', payload);
      setSuccess(true);
      await refreshProfile();
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error purchasing subscription:', err);
      setError(err.message || 'Failed to complete subscription booking.');
    } finally {
      setSubmitting(false);
      setUploadingImage(false);
    }
  };

  const eventSlots = getEventSlots();
  const mockUpiId = "nextgenpayments@ybl";

  return (
    <div className="slots-page container">
      <section className="slots-hero text-center">
        <h1 className="slots-title">Priority Care <span className="text-gradient">Annual Slots</span></h1>
        <p className="slots-subtitle">
          Secure an annual slot in your region to unlock priority scheduling and discounted booking prices.
        </p>
      </section>

      {user?.subscription && user.subscription.status !== 'Rejected' && (
        <div className="banner info-banner container-small">
          <Shield size={18} />
          <span>You have an active or pending subscription slot: <strong>#{user.subscription.slotNumber}</strong>. You can only hold one active slot at a time.</span>
        </div>
      )}
      
      {user?.subscription?.status === 'Rejected' && (
        <div className="banner error-banner container-small">
          <AlertTriangle size={18} />
          <span>Your previous subscription request was rejected. You may choose a new slot.</span>
        </div>
      )}

      {error && (
        <div className="banner error-banner container-small">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="slots-layout-grid">
        {/* Left Side: Filter Form */}
        <div className="slots-filters-sidebar">
          <div className="filter-form-card glass-card">
            <h3>Choose Subscription Parameters</h3>
            
            {/* District Selector */}
            <div className="form-group">
              <label htmlFor="district-select">Select District</label>
              <select
                id="district-select"
                value={selectedDistrictId}
                onChange={(e) => setSelectedDistrictId(e.target.value)}
                disabled={districtsLoading || (user?.subscription && user.subscription.status !== 'Rejected')}
              >
                <option value="">-- Select District --</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Mandal Selector */}
            <div className="form-group">
              <label htmlFor="mandal-select">Select Mandal</label>
              <select
                id="mandal-select"
                value={selectedMandalId}
                onChange={(e) => setSelectedMandalId(e.target.value)}
                disabled={!selectedDistrictId || mandalsLoading || (user?.subscription && user.subscription.status !== 'Rejected')}
              >
                <option value="">
                  {mandalsLoading ? 'Loading mandals...' : '-- Select Mandal --'}
                </option>
                {mandals.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Event Selector */}
            <div className="form-group">
              <label htmlFor="event-select">Select Event</label>
              <select
                id="event-select"
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                disabled={!selectedMandalId || eventsLoading || (user?.subscription && user.subscription.status !== 'Rejected')}
              >
                <option value="">
                  {eventsLoading ? 'Loading events...' : '-- Select Event --'}
                </option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.event_name}</option>
                ))}
              </select>
            </div>

            {/* Event Details / Description Panel */}
            {activeEvent && (
              <div className="pricing-indicator-box animate-fade-in" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                  <Info size={18} color="#0984E3" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: '#111827' }}>Event Details</strong>
                    <span style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: '1.4' }}>
                      {activeEvent.description || 'No description provided.'}
                    </span>
                  </div>
                </div>
                <div className="price-number">₹{parseInt(activeEvent.price)}/yr</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Grid Selector & Payment */}
        <div className="slots-selection-content" ref={selectionRef}>
          <div className="slots-grid-card glass-card">
            <h3>Step 2: Choose Slot Number</h3>
            
            {!selectedEventId ? (
              <div className="empty-slots-placeholder">
                <Calendar size={36} className="placeholder-icon" />
                <p>Please select an Event from the left panel to load available slots.</p>
              </div>
            ) : slotsLoading ? (
              <div className="slots-loading text-center">
                <div className="spinner"></div>
                <p>Loading Event slot status...</p>
              </div>
            ) : eventSlots.length === 0 ? (
              <div className="empty-slots-placeholder text-danger">
                <AlertTriangle size={36} className="placeholder-icon" />
                <p>No slots configured for Event: <strong>{activeEvent?.event_name}</strong>. Please contact admin.</p>
              </div>
            ) : selectedSlot ? (
              <div className="selected-slot-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F0F9FF', padding: '16px', borderRadius: '12px', border: '1px solid #BAE6FD', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ backgroundColor: '#0EA5E9', color: '#FFF', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    #{selectedSlot}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: '#0369A1' }}>Slot Selected</h4>
                    <span style={{ fontSize: '0.85rem', color: '#0284C7' }}>You have reserved this slot for booking.</span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #0EA5E9', color: '#0EA5E9', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Change Slot
                </button>
              </div>
            ) : (
              <>
                <p className="slots-helper-text">Select a green slot to book. Red slots are already taken.</p>
                <div className="slots-grid">
                  {eventSlots.map((slotNum) => {
                    const isBooked = bookedSlots.includes(slotNum);
                    const isSelected = selectedSlot === slotNum;
                    
                    return (
                      <button
                        key={slotNum}
                        onClick={() => !isBooked && setSelectedSlot(slotNum)}
                        disabled={isBooked || (user?.subscription && user.subscription.status !== 'Rejected')}
                        className={`slot-box-btn ${isBooked ? 'booked' : 'available'} ${isSelected ? 'selected' : ''}`}
                      >
                        <span className="slot-title">Slot</span>
                        <span className="slot-number">#{slotNum}</span>
                        <span className="slot-status">{isBooked ? 'Booked' : 'Available'}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Payment Method Panel */}
          {selectedSlot && activeEvent && (!user?.subscription || user.subscription.status === 'Rejected') && (
            <div className="payment-method-card glass-card animate-slide-up" style={{ marginTop: '20px' }} ref={paymentRef}>
              <h3>Step 3: Payment Details</h3>
              <div className="payment-options">
                <label className={`payment-option ${paymentMode === 'offline' ? 'active' : ''}`}>
                  <input type="radio" name="paymentMode" value="offline" checked={paymentMode === 'offline'} onChange={(e) => setPaymentMode(e.target.value)} />
                  <div className="option-content">
                    <strong>Pay Offline / Cash Collection</strong>
                    <span>An agent will collect cash or you can pay at the office.</span>
                  </div>
                </label>
                <label className={`payment-option ${paymentMode === 'online' ? 'active' : ''}`}>
                  <input type="radio" name="paymentMode" value="online" checked={paymentMode === 'online'} onChange={(e) => setPaymentMode(e.target.value)} />
                  <div className="option-content">
                    <strong>Pay Online via UPI</strong>
                    <span>Scan QR code and upload screenshot.</span>
                  </div>
                </label>
              </div>

              {paymentMode === 'online' && (
                <div className="online-payment-details">
                  <div className="qr-section">
                    <div className="qr-placeholder" style={{ backgroundColor: '#fff', border: '2px dashed #D1D5DB', borderRadius: '12px', padding: '20px', textAlign: 'center', width: '200px', height: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <QrCode size={48} color="#00B894" />
                      <span style={{ fontSize: '0.8rem', marginTop: '10px', color: '#6B7280' }}>Pay to UPI ID:</span>
                      <strong style={{ fontSize: '0.9rem', color: '#111827' }}>{mockUpiId}</strong>
                    </div>
                  </div>
                  
                  <div className="upload-section">
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label>Transaction ID *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. T2105151234" 
                        className="form-control" 
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Payment Screenshot *</label>
                      <input 
                        type="file" 
                        accept="image/*"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImageChange}
                      />
                      
                      {!screenshotPreview ? (
                        <button type="button" className="upload-btn-custom" onClick={() => fileInputRef.current.click()}>
                          <Upload size={18} /> Choose Image
                        </button>
                      ) : (
                        <div className="screenshot-preview-container">
                          <img src={screenshotPreview} alt="Screenshot" className="screenshot-img" />
                          <button type="button" className="change-img-btn" onClick={() => fileInputRef.current.click()}>Change</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Booking Summary Panel */}
          {selectedSlot && activeEvent && (!user?.subscription || user.subscription.status === 'Rejected') && (
            <div className="subscription-summary-card glass-card animate-slide-up" style={{ marginTop: '20px' }}>
              <div className="summary-details">
                <div className="summary-logo-row">
                  <Shield size={24} className="logo-icon text-gradient" />
                  <h4>Subscription Confirmation</h4>
                </div>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span>Region</span>
                    <strong>{districts.find(d => String(d.id) === String(selectedDistrictId))?.name} / {activeMandal?.name}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Event Name</span>
                    <strong>{activeEvent.event_name}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Slot Selected</span>
                    <strong className="text-gradient">Slot #{selectedSlot}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Subtotal</span>
                    <strong className="text-gradient">₹{activeEvent.price}</strong>
                  </div>
                </div>
              </div>

              {success ? (
                <div className="booking-success-indicator">
                  <CheckCircle2 size={20} />
                  <span>Request submitted successfully! Redirecting...</span>
                </div>
              ) : (
                <button
                  onClick={handleBookSlot}
                  disabled={submitting || uploadingImage}
                  className="btn btn-primary btn-block btn-checkout"
                >
                  <CreditCard size={18} />
                  <span>{submitting ? (uploadingImage ? 'Uploading Image...' : 'Processing...') : `Submit Request - ₹${parseInt(activeEvent.price)}`}</span>
                  <ChevronRight size={18} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
