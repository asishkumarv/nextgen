import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Calendar, Shield, CreditCard, CheckCircle2, ChevronRight, AlertTriangle, QrCode, Upload, Info } from 'lucide-react';
import nextgenQr from '../assets/nextgenQr.jpeg';
import './Slots.css';

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const MAX_WIDTH = 1200;
      const MAX_HEIGHT = 1200;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) resolve(blob); // Return Blob directly, avoiding new File() compatibility issues on mobile
        else reject(new Error('Canvas compression failed'));
      }, 'image/jpeg', 0.8);
    };
    img.onerror = () => reject(new Error('Image load failed for compression'));
    img.src = url;
  });
};

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
  const [slotSearchQuery, setSlotSearchQuery] = useState('');

  // Payment States
  const [paymentMode, setPaymentMode] = useState('offline'); // 'online' or 'offline'
  const [transactionId, setTransactionId] = useState('');
  const [transactionError, setTransactionError] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState('');
  const [screenshotError, setScreenshotError] = useState('');
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
      setSlotSearchQuery('');
      return;
    }
    const fetchBookedSlots = async () => {
      setSlotsLoading(true);
      try {
        const data = await api.get(`/subscription/booked?eventId=${selectedEventId}`);
        setBookedSlots(data.bookedSlots || []);
        setSelectedSlot(null);
        setSlotSearchQuery('');
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
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setScreenshotError('');
      setError('');
    }
  };

  const handleBookSlot = async () => {
    setTransactionError('');
    setScreenshotError('');
    setError('');

    if (!selectedDistrictId || !selectedMandalId || !selectedEventId || !selectedSlot) {
      setError('Please select a District, Mandal, Event, and Slot number.');
      return;
    }

    let hasError = false;
    if (paymentMode === 'online') {
      if (!transactionId.trim()) {
        setTransactionError('Please enter the UPI Transaction ID.');
        hasError = true;
      }
      if (!screenshotFile) {
        setScreenshotError('Please upload a screenshot of your payment.');
        hasError = true;
      }
    }
    
    if (hasError) return;

    setSubmitting(true);
    setError('');

    try {
      let screenshotUrl = null;

      if (paymentMode === 'online' && screenshotFile) {
        setUploadingImage(true);
        try {
          const formData = new FormData();
          
          let fileToProcess = screenshotFile;
          try {
            // Attempt to compress first (saves huge amounts of bandwidth and memory)
            fileToProcess = await compressImage(screenshotFile);
          } catch (compressionErr) {
            // If compression fails (e.g., iPhone HEIC format), fallback to raw file
            console.warn('Compression skipped/failed, using raw file:', compressionErr);
          }
          
          formData.append('image', fileToProcess);
          
          // The backend /upload endpoint natively parses the file and returns the Base64 string for DB storage
          const uploadRes = await api.upload('/upload', formData);
          
          if (uploadRes && uploadRes.url) {
            screenshotUrl = uploadRes.url;
          } else {
            throw new Error('Server failed to process image');
          }
        } catch (uploadErr) {
          const errorMessage = uploadErr instanceof Error ? uploadErr.message : 'Server error or memory limit exceeded';
          throw new Error(`Failed to process screenshot: ${errorMessage}`);
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
  const filteredSlots = eventSlots.filter(slot => slot.toString().includes(slotSearchQuery.trim()));
  const mockUpiId = "Vyapar.175693314872@hdfcbank";

  return (
    <div className="slots-page container">
      {/* Fullscreen Loading Overlay */}
      {(submitting || success) && (
        <div className="fullscreen-loader-overlay">
          <div className="loader-content animate-slide-up">
            {success ? (
              <>
                <CheckCircle2 size={64} color="#10B981" className="success-icon-animate" />
                <h2 style={{ marginTop: '20px', color: '#111827', fontWeight: '800' }}>Request Submitted!</h2>
                <p style={{ color: '#6B7280', marginTop: '10px' }}>Waiting for admin approval. Redirecting to your dashboard...</p>
              </>
            ) : (
              <>
                <div className="spinner-large"></div>
                <h2 style={{ marginTop: '24px', color: '#111827', fontWeight: '800' }}>Processing Request</h2>
                <p style={{ color: '#6B7280', marginTop: '12px' }}>
                  {uploadingImage ? 'Securely uploading your payment screenshot...' : 'Finalizing your subscription slot...'}
                </p>
                <p style={{ color: '#0984E3', marginTop: '16px', fontSize: '0.85rem', fontWeight: '700' }}>Please do not close or refresh this page.</p>
              </>
            )}
          </div>
        </div>
      )}

      <section className="slots-hero text-center">
        <h1 className="slots-title">Priority Care <span className="text-gradient">Annual Slots</span></h1>
        <p className="slots-subtitle">
          Secure an annual slot in your region to unlock priority scheduling and discounted booking prices.
        </p>
      </section>

      {/* Existing Subscriptions List */}
      {user?.subscriptions && user.subscriptions.length > 0 && (
        <div className="container-small" style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '16px', color: '#111827' }}>My Subscriptions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {user.subscriptions.map((sub, index) => (
              <div key={sub.id || index}>
                {sub.status === 'Pending' ? (
                  <div className="banner" style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D', color: '#B45309', margin: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Info size={18} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700' }}>PENDING APPROVAL: {sub.plan || 'Power Care Annual'}</span>
                        <span style={{ fontSize: '0.9rem', marginTop: '4px' }}>Slot #{sub.slotNumber} · Paid via {sub.paymentMode || 'Online'}</span>
                      </div>
                    </div>
                  </div>
                ) : sub.status === 'Rejected' ? (
                  <div className="banner error-banner" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={18} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700' }}>REQUEST REJECTED</span>
                        <span style={{ fontSize: '0.9rem', marginTop: '4px' }}>Your request for slot #{sub.slotNumber} was not approved.</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="banner success-banner" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckCircle2 size={18} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '700' }}>ACTIVE SUBSCRIPTION: {sub.plan || 'Power Care Annual'}</span>
                        <span style={{ fontSize: '0.9rem', marginTop: '4px' }}>Slot #{sub.slotNumber} · Expires: {sub.expiry_date ? new Date(sub.expiry_date).toLocaleDateString() : 'Active'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
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
                disabled={districtsLoading}
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
                disabled={!selectedDistrictId || mandalsLoading}
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
                disabled={!selectedMandalId || eventsLoading}
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
                  <Info size={18} color="var(--secondary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Event Details</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
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
              <div className="selected-slot-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ backgroundColor: 'var(--secondary)', color: '#FFF', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    #{selectedSlot}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Slot Selected</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>You have reserved this slot for booking.</span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--secondary)', color: 'var(--secondary)', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Change Slot
                </button>
              </div>
            ) : (
              <>
                <p className="slots-helper-text">Select a green slot to book. Red slots are already taken.</p>
                <div className="slots-search-container" style={{ marginBottom: '16px' }}>
                  <input
                    type="text"
                    placeholder="Search slot number..."
                    value={slotSearchQuery}
                    onChange={(e) => setSlotSearchQuery(e.target.value)}
                    className="form-control"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                  />
                </div>
                <div className="slots-grid">
                  {filteredSlots.map((slotNum) => {
                    const isBooked = bookedSlots.some(s => String(s).trim() === String(slotNum).trim());
                    const isSelected = selectedSlot === slotNum;
                    
                    return (
                      <button
                        key={slotNum}
                        onClick={() => !isBooked && setSelectedSlot(slotNum)}
                        disabled={isBooked}
                        className={`slot-box-btn ${isBooked ? 'booked' : 'available'} ${isSelected ? 'selected' : ''}`}
                      >
                        <span className="slot-title">Slot</span>
                        <span className="slot-number">#{slotNum}</span>
                        <span className="slot-status">{isBooked ? 'Booked' : 'Available'}</span>
                      </button>
                    );
                  })}
                  {filteredSlots.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280', gridColumn: '1 / -1' }}>
                      No slots found matching "{slotSearchQuery}"
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Payment Method Panel */}
          {selectedSlot && activeEvent && (
            <div className="payment-method-card glass-card animate-slide-up" style={{ marginTop: '20px' }} ref={paymentRef}>
              <h3>Step 3: Payment Details</h3>
              <div className="payment-options">
                <label 
                  className={`payment-option ${paymentMode === 'offline' ? 'active' : ''}`}
                  style={{ 
                    backgroundColor: paymentMode === 'offline' ? 'var(--primary-glow)' : 'var(--bg-tertiary)',
                    borderColor: paymentMode === 'offline' ? 'var(--primary)' : 'var(--border-color)'
                  }}
                >
                  <input type="radio" name="paymentMode" value="offline" checked={paymentMode === 'offline'} onChange={(e) => setPaymentMode(e.target.value)} />
                  <div className="option-content">
                    <strong style={{ color: 'var(--text-primary)' }}>Pay Offline / Cash Collection</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>An agent will collect cash or you can pay at the office.</span>
                  </div>
                </label>
                <label 
                  className={`payment-option ${paymentMode === 'online' ? 'active' : ''}`}
                  style={{ 
                    backgroundColor: paymentMode === 'online' ? 'var(--primary-glow)' : 'var(--bg-tertiary)',
                    borderColor: paymentMode === 'online' ? 'var(--primary)' : 'var(--border-color)'
                  }}
                >
                  <input type="radio" name="paymentMode" value="online" checked={paymentMode === 'online'} onChange={(e) => setPaymentMode(e.target.value)} />
                  <div className="option-content">
                    <strong style={{ color: 'var(--text-primary)' }}>Pay Online via UPI</strong>
                    <span style={{ color: 'var(--text-secondary)' }}>Scan QR code and upload screenshot.</span>
                  </div>
                </label>
              </div>

              {paymentMode === 'online' && (
                <div className="online-payment-details">
                  <div className="qr-section">
                    <div className="qr-placeholder" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', textAlign: 'center', width: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                      <img src={nextgenQr} alt="Payment QR Code" style={{ width: '100%', height: 'auto', borderRadius: '8px', marginBottom: '12px' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pay to UPI ID:</span>
                      <strong 
                        style={{ 
                          fontSize: '0.85rem', 
                          color: 'var(--text-primary)', 
                          marginTop: '4px',
                          wordBreak: 'break-all',
                          userSelect: 'all',
                          cursor: 'copy',
                          padding: '4px 8px',
                          backgroundColor: 'var(--bg-secondary)',
                          borderRadius: '6px',
                          border: '1px dashed var(--border-color)'
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText(mockUpiId);
                          alert('UPI ID copied to clipboard!');
                        }}
                        title="Click to copy"
                      >
                        {mockUpiId}
                      </strong>
                    </div>
                  </div>
                  
                  <div className="upload-section">
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                      <label>Transaction ID *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. T2105151234" 
                        className={`form-control ${transactionError ? 'is-invalid' : ''}`}
                        style={transactionError ? { borderColor: 'var(--danger)' } : {}}
                        value={transactionId}
                        onChange={(e) => {
                          setTransactionId(e.target.value);
                          if(e.target.value.trim()) setTransactionError('');
                        }}
                      />
                      {transactionError && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px' }}>{transactionError}</div>}
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
                        <button type="button" className="upload-btn-custom" style={screenshotError ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : {}} onClick={() => fileInputRef.current.click()}>
                          <Upload size={18} /> Choose Image
                        </button>
                      ) : (
                        <div className="screenshot-preview-container">
                          <img src={screenshotPreview} alt="Screenshot" className="screenshot-img" />
                          <button type="button" className="change-img-btn" onClick={() => fileInputRef.current.click()}>Change</button>
                        </div>
                      )}
                      {screenshotError && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '4px' }}>{screenshotError}</div>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Booking Summary Panel */}
          {selectedSlot && activeEvent && (
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

              {error && (
                <div className="banner error-banner" style={{ margin: '0 0 16px 0', padding: '12px' }}>
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              )}

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
