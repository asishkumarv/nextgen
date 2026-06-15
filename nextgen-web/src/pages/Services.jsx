import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Calendar, Clock, MapPin, Wrench, CheckCircle, AlertTriangle, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Services() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State Variables
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Choose Service, 2: Schedule, 3: Address, 4: Confirm
  const [selectedService, setSelectedService] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [address, setAddress] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [createdBooking, setCreatedBooking] = useState(null);

  // Fetch active services on mount
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await api.get('/services');
        setServices(data || []);
        setError('');
      } catch (err) {
        console.error('Error fetching services:', err);
        setError(err.message || 'Failed to retrieve services.');
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setCurrentStep(2);
  };

  const handleNextStep = () => {
    if (currentStep === 2 && (!bookingDate || !timeSlot)) {
      setBookingError('Please select both a date and a time slot.');
      return;
    }
    if (currentStep === 3 && !address.trim()) {
      setBookingError('Please enter a valid service address.');
      return;
    }
    setBookingError('');
    setCurrentStep(currentStep + 1);
  };

  const handlePrevStep = () => {
    setBookingError('');
    setCurrentStep(currentStep - 1);
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !bookingDate || !timeSlot || !address.trim()) {
      setBookingError('Missing required booking details. Please verify your entries.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');
    
    // Construct request payload
    // Skipped districtId and mandalId for both subscribed and non-subscribed users. 
    // Subscribed users will have their location auto-assigned in the backend using their active subscription data.
    const payload = {
      serviceName: selectedService.title,
      price: selectedService.price,
      date: bookingDate,
      timeSlot: timeSlot,
      address: address.trim(),
    };

    try {
      const result = await api.post('/bookings', payload);
      setCreatedBooking(result);
      setBookingSuccess(true);
      setCurrentStep(5); // Success state step
    } catch (err) {
      console.error('Error creating booking:', err);
      setBookingError(err.message || 'Server error creating booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const activeSubs = user?.subscriptions?.filter(s => s.status === 'Active') || [];
  const isSubscribed = activeSubs.length > 0;
  const activeSub = activeSubs[0]; // fallback for legacy logic

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
  const timeSlots = [
    'Morning (09:00 AM - 12:00 PM)',
    'Afternoon (12:00 PM - 03:00 PM)',
    'Evening (03:00 PM - 06:00 PM)',
  ];

  // Minimum date selection helper (today)
  const getMinDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  if (loading) {
    return (
      <div className="container spinner-container text-center">
        <div className="spinner"></div>
        <p>Loading available electrical and maintenance services...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container error-container text-center">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Failed to Load Services</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">Retry Loading</button>
      </div>
    );
  }

  return (
    <div className="services-page container">
      {/* Step Progress Stepper */}
      {currentStep <= 4 && (
        <div className="stepper-wrapper glass-card">
          <div className="stepper-header">
            <h2>Book a Service Technician</h2>
            <p>Complete the short steps below to schedule a verified repair.</p>
          </div>
          <div className="stepper-indicators">
            <div className={`step-indicator ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-num">1</div>
              <span>Service</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-indicator ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className="step-num">2</div>
              <span>Schedule</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-indicator ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
              <div className="step-num">3</div>
              <span>Address</span>
            </div>
            <div className="step-line"></div>
            <div className={`step-indicator ${currentStep >= 4 ? 'active' : ''}`}>
              <div className="step-num">4</div>
              <span>Confirm</span>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Errors */}
      {bookingError && (
        <div className="banner error-banner container-small">
          <AlertTriangle size={18} />
          <span>{bookingError}</span>
        </div>
      )}

      {/* Step 1: Select Service */}
      {currentStep === 1 && (
        <div className="services-selector-step animate-fade-in">
          <div className="section-title-row">
            <h3>Step 1: Select a Service</h3>
            <p>Choose the repair or configuration task you need performed.</p>
          </div>
          
          <div className="services-list-grid">
            {services.map((service) => (
              <div
                key={service.id}
                className={`service-selection-card glass-card ${selectedService?.id === service.id ? 'selected' : ''}`}
                onClick={() => handleServiceSelect(service)}
              >
                <div className="card-icon-title">
                  <div className="service-icon-bg">
                    <Wrench size={22} className="service-icon" />
                  </div>
                  <div>
                    <h4>{service.title}</h4>
                    <p className="card-sub">{service.subtitle}</p>
                  </div>
                </div>
                <div className="card-footer-row">
                  <span className="price-tag">
                    {isServiceIncluded(service.title) ? (
                      <>
                        <span className="original-price">₹{service.price}</span>
                        <span className="free-price">₹0.00 Free</span>
                      </>
                    ) : (
                      `₹${service.price}`
                    )}
                  </span>
                  <button className="btn btn-secondary btn-sm">Select Service</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Choose Date & Time */}
      {currentStep === 2 && (
        <div className="step-form-wrapper glass-card container-small animate-fade-in">
          <div className="step-form-header">
            <h3>Step 2: Choose Schedule</h3>
            <p>Selected Service: <strong>{selectedService?.title}</strong></p>
          </div>

          <div className="form-group">
            <label htmlFor="booking-date">Choose Date <span className="required">*</span></label>
            <div className="input-with-icon">
              <Calendar className="input-icon" size={16} />
              <input
                type="date"
                id="booking-date"
                value={bookingDate}
                min={getMinDate()}
                onChange={(e) => setBookingDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Preferred Time Slot <span className="required">*</span></label>
            <div className="slots-radio-grid">
              {timeSlots.map((slot) => (
                <label
                  key={slot}
                  className={`slot-radio-card ${timeSlot === slot ? 'checked' : ''}`}
                >
                  <input
                    type="radio"
                    name="timeSlot"
                    value={slot}
                    checked={timeSlot === slot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                  />
                  <Clock size={16} />
                  <span>{slot}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="step-navigation-buttons">
            <button onClick={handlePrevStep} className="btn btn-secondary-outline">
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button onClick={handleNextStep} className="btn btn-primary">
              <span>Next</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Enter Address */}
      {currentStep === 3 && (
        <div className="step-form-wrapper glass-card container-small animate-fade-in">
          <div className="step-form-header">
            <h3>Step 3: Service Address</h3>
            <p>Where should our dispatched technician arrive?</p>
          </div>

          <div className="form-group">
            <label htmlFor="service-address">Detailed House Address <span className="required">*</span></label>
            <div className="input-with-icon textarea-wrapper">
              <MapPin className="input-icon textarea-icon" size={16} />
              <textarea
                id="service-address"
                rows="4"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House No, Street, Landmark, City / Village Name..."
                required
              ></textarea>
            </div>
            <p className="field-hint">Note: Mandal and District parameters are skipped for easy scheduling.</p>
          </div>

          <div className="step-navigation-buttons">
            <button onClick={handlePrevStep} className="btn btn-secondary-outline">
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button onClick={handleNextStep} className="btn btn-primary">
              <span>Next: Review</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Confirm Booking */}
      {currentStep === 4 && (
        <div className="step-form-wrapper glass-card container-small animate-fade-in">
          <div className="step-form-header text-center">
            <h3>Step 4: Review and Confirm</h3>
            <p>Please double-check your booking details before sending request.</p>
          </div>

          <div className="review-details-grid">
            <div className="review-item">
              <span className="r-label">Selected Service</span>
              <span className="r-value">{selectedService?.title}</span>
            </div>
            <div className="review-item">
              <span className="r-label">Schedule Date</span>
              <span className="r-value">{bookingDate}</span>
            </div>
            <div className="review-item">
              <span className="r-label">Time Slot</span>
              <span className="r-value">{timeSlot}</span>
            </div>
            <div className="review-item">
              <span className="r-label">Service Address</span>
              <span className="r-value">{address}</span>
            </div>

            {isServiceIncluded(selectedService?.title) ? (
              <div className="review-item subscription-coverage-item">
                <span className="r-label">Member Benefits</span>
                <span className="r-value highlight-green">
                  <ShieldCheck size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                  Priority slot pricing applied (Free Booking)
                </span>
              </div>
            ) : (
              <div className="review-item regular-billing-item">
                <span className="r-label">Total Charge</span>
                <span className="r-value highlight-blue">₹{selectedService?.price}</span>
              </div>
            )}
          </div>

          {isSubscribed && activeSub && (
            <div className="info-banner-blue">
              <ShieldCheck size={18} />
              <p>As a Priority Care subscriber in <strong>{activeSub.districtName}/{activeSub.mandalName}</strong>, this request will automatically inherit your slot region and balance parameters for vendor allocation.</p>
            </div>
          )}

          <div className="step-navigation-buttons">
            <button onClick={handlePrevStep} className="btn btn-secondary-outline" disabled={bookingLoading}>
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              onClick={handleConfirmBooking}
              className="btn btn-primary"
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <span>Confirming Booking...</span>
              ) : (
                <>
                  <span>Confirm and Book</span>
                  <CheckCircle size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Success Screen */}
      {currentStep === 5 && bookingSuccess && createdBooking && (
        <div className="success-screen-wrapper glass-card container-small text-center animate-fade-in">
          <div className="success-animation-circle">
            <CheckCircle size={64} className="success-check-icon" />
          </div>
          <h2>Booking Confirmed!</h2>
          <p className="success-sub">Your request has been filed under ID: <strong>{createdBooking.id}</strong></p>

          <div className="summary-card">
            <div className="summary-row">
              <span>Service Requested:</span>
              <strong>{createdBooking.serviceName}</strong>
            </div>
            <div className="summary-row">
              <span>Scheduled For:</span>
              <strong>{createdBooking.date}</strong>
            </div>
            <div className="summary-row">
              <span>Amount Paid:</span>
              <strong className="text-gradient">
                {parseFloat(createdBooking.price) === 0 ? '₹0.00 (PRO)' : `₹${createdBooking.price}`}
              </strong>
            </div>
            <div className="summary-row">
              <span>Completion OTP:</span>
              <strong className="otp-highlight">{createdBooking.otp}</strong>
            </div>
            <div className="summary-row">
              <span>Status:</span>
              <span className={`status-badge status-${createdBooking.status.toLowerCase()}`}>
                {createdBooking.status}
              </span>
            </div>
          </div>

          <div className="action-buttons-success">
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
              Go To Dashboard
            </button>
            <button onClick={() => { setSelectedService(null); setBookingDate(''); setTimeSlot(''); setAddress(''); setBookingSuccess(false); setCreatedBooking(null); setCurrentStep(1); }} className="btn btn-secondary">
              Book Another Service
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
