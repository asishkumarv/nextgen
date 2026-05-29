import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Calendar, Shield, CreditCard, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';

export default function Slots() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Filter States
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedMandalId, setSelectedMandalId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Loading & Error States
  const [districtsLoading, setDistrictsLoading] = useState(true);
  const [mandalsLoading, setMandalsLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const activeMandal = mandals.find((m) => String(m.id) === String(selectedMandalId));

  const eventCategories = activeMandal && activeMandal.event_names
    ? activeMandal.event_names.split(',').map((e) => e.trim()).filter(Boolean)
    : [];

  // Fetch Districts on mount
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const data = await api.get('/subscription/districts');
        setDistricts(data || []);
        setError('');
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
      setSelectedEvent('');
      setSelectedSlot(null);
      return;
    }

    const fetchMandals = async () => {
      setMandalsLoading(true);
      setError('');
      try {
        const data = await api.get(`/subscription/mandals?districtId=${selectedDistrictId}`);
        setMandals(data || []);
        setSelectedMandalId('');
        setSelectedEvent('');
        setSelectedSlot(null);
      } catch (err) {
        console.error('Error fetching mandals:', err);
        setError('Failed to fetch mandals.');
      } finally {
        setMandalsLoading(false);
      }
    };

    fetchMandals();
  }, [selectedDistrictId]);

  // Fetch Booked Slots when Mandal changes
  useEffect(() => {
    if (!selectedMandalId) {
      setBookedSlots([]);
      setSelectedEvent('');
      setSelectedSlot(null);
      return;
    }

    const fetchBookedSlots = async () => {
      setSlotsLoading(true);
      setError('');
      try {
        const data = await api.get(`/subscription/booked?mandalId=${selectedMandalId}`);
        setBookedSlots(data.bookedSlots || []);
        setSelectedEvent('');
        setSelectedSlot(null);
      } catch (err) {
        console.error('Error fetching booked slots:', err);
        setError('Failed to load reserved slots list.');
      } finally {
        setSlotsLoading(false);
      }
    };

    fetchBookedSlots();
  }, [selectedMandalId]);

  // Parse Slots for current Mandal
  const getMandalSlots = () => {
    if (!activeMandal || !activeMandal.slots) return [];
    // slots is a string like "1, 2, 3" or range-based in db. 
    // In db, backend uses comma-split. Let's split and clean it up.
    return activeMandal.slots.split(',').map((s) => parseInt(s.trim(), 10)).filter((s) => !isNaN(s));
  };

  const handleBookSlot = async () => {
    if (user?.subscription) {
      setError('You already have an active subscription slot.');
      return;
    }
    if (!selectedDistrictId || !selectedMandalId || !selectedEvent || !selectedSlot) {
      setError('Please select a District, Mandal, Event category, and Slot number.');
      return;
    }

    setSubmitting(true);
    setError('');

    const payload = {
      districtId: parseInt(selectedDistrictId, 10),
      mandalId: parseInt(selectedMandalId, 10),
      slotNumber: selectedSlot,
      eventName: selectedEvent,
    };

    try {
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
    }
  };

  const mandalSlots = getMandalSlots();

  return (
    <div className="slots-page container">
      <section className="slots-hero text-center">
        <h1 className="slots-title">Priority Care <span className="text-gradient">Annual Slots</span></h1>
        <p className="slots-subtitle">
          Secure an annual slot in your region to unlock priority scheduling and completely free bookings for the year.
        </p>
      </section>

      {user?.subscription && (
        <div className="banner info-banner container-small">
          <Shield size={18} />
          <span>You already have an active subscription slot: <strong>#{user.subscription.slotNumber} ({user.subscription.eventName})</strong>. You can only hold one active slot at a time.</span>
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
                disabled={districtsLoading || !!user?.subscription}
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
                disabled={!selectedDistrictId || mandalsLoading || !!user?.subscription}
              >
                <option value="">
                  {mandalsLoading ? 'Loading mandals...' : '-- Select Mandal --'}
                </option>
                {mandals.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Event Category Selector */}
            <div className="form-group">
              <label htmlFor="event-select">Event Category</label>
              <select
                id="event-select"
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                disabled={!selectedMandalId || !!user?.subscription}
              >
                <option value="">-- Select Event --</option>
                {eventCategories.map((ev) => (
                  <option key={ev} value={ev}>{ev}</option>
                ))}
              </select>
            </div>

            {/* Subscription Pricing Panel */}
            {activeMandal && (
              <div className="pricing-indicator-box animate-fade-in">
                <div className="pricing-title">Annual Plan Pricing</div>
                <div className="price-number">₹{parseInt(activeMandal.subscription_price)}/yr</div>
                <p className="price-detail">Includes 12 months validity and zero-fee service dispatch.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Grid Selector & Confirm */}
        <div className="slots-selection-content">
          <div className="slots-grid-card glass-card">
            <h3>Step 2: Choose Slot Number</h3>
            
            {!selectedMandalId ? (
              <div className="empty-slots-placeholder">
                <Calendar size={36} className="placeholder-icon" />
                <p>Please select a District and Mandal from the left panel to load available slots.</p>
              </div>
            ) : slotsLoading ? (
              <div className="slots-loading text-center">
                <div className="spinner"></div>
                <p>Loading Mandal slot status...</p>
              </div>
            ) : mandalSlots.length === 0 ? (
              <div className="empty-slots-placeholder text-danger">
                <AlertTriangle size={36} className="placeholder-icon" />
                <p>No slots configured for Mandal: <strong>{activeMandal?.name}</strong>. Please contact admin.</p>
              </div>
            ) : (
              <>
                <p className="slots-helper-text">Select a green slot to book. Red slots are already taken.</p>
                <div className="slots-grid">
                  {mandalSlots.map((slotNum) => {
                    const isBooked = bookedSlots.includes(slotNum);
                    const isSelected = selectedSlot === slotNum;
                    
                    return (
                      <button
                        key={slotNum}
                        onClick={() => !isBooked && setSelectedSlot(slotNum)}
                        disabled={isBooked || !!user?.subscription}
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

          {/* Booking Summary Panel */}
          {selectedSlot && activeMandal && selectedEvent && !user?.subscription && (
            <div className="subscription-summary-card glass-card animate-slide-up">
              <div className="summary-details">
                <div className="summary-logo-row">
                  <Shield size={24} className="logo-icon text-gradient" />
                  <h4>Priority Care Annual Subscription Summary</h4>
                </div>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span>Region</span>
                    <strong>{districts.find(d => String(d.id) === String(selectedDistrictId))?.name} / {activeMandal.name}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Event Name</span>
                    <strong>{selectedEvent}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Slot Selected</span>
                    <strong className="text-gradient">Slot #{selectedSlot}</strong>
                  </div>
                  <div className="summary-item">
                    <span>Subtotal</span>
                    <strong className="text-gradient">₹{activeMandal.subscription_price}</strong>
                  </div>
                </div>
              </div>

              {success ? (
                <div className="booking-success-indicator">
                  <CheckCircle2 size={20} />
                  <span>Purchase successful! Redirecting to dashboard...</span>
                </div>
              ) : (
                <button
                  onClick={handleBookSlot}
                  disabled={submitting}
                  className="btn btn-primary btn-block btn-checkout"
                >
                  <CreditCard size={18} />
                  <span>{submitting ? 'Processing Payment...' : `Pay & Subscribe - ₹${parseInt(activeMandal.subscription_price)}`}</span>
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
