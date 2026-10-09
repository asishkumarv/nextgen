import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  KeyRound,
  Phone,
  User,
  ShieldAlert,
  Eye,
  EyeOff,
  Mail,
  MapPin,
  Map,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Gift,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { api } from '../utils/api';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialPhone = searchParams.get('phone') || '';
  const initialRef = searchParams.get('ref') || '';

  // Multi-step: 1 = Mobile OTP, 2 = Profile, 3 = Location, 4 = Password & Finish
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Phone & OTP States
  const [phone, setPhone] = useState(initialPhone);
  const [phoneError, setPhoneError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [existingUserFound, setExistingUserFound] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Step 2: Personal Details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState(initialRef ? initialRef.toUpperCase() : '');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Step 3: Location Details
  const [districtId, setDistrictId] = useState('');
  const [mandalId, setMandalId] = useState('');
  const [address, setAddress] = useState('');
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [locationError, setLocationError] = useState('');

  // Step 4: Security Details
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  // Fetch districts on mount
  useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const data = await api.get('/subscription/districts');
        setDistricts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load districts:', err);
      }
    };
    fetchDistricts();
  }, []);

  // Fetch mandals when district changes
  useEffect(() => {
    const fetchMandals = async () => {
      if (!districtId) {
        setMandals([]);
        return;
      }
      try {
        const data = await api.get(`/subscription/mandals?districtId=${districtId}`);
        setMandals(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load mandals:', err);
      }
    };
    fetchMandals();
  }, [districtId]);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Password strength
  const getPasswordStrength = (p) => {
    if (!p) return 0;
    let score = 0;
    if (p.length >= 6) score++;
    if (p.length >= 8 && /[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p)) score++;
    return score;
  };
  const strength = getPasswordStrength(password);
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][strength] || 'Weak';
  const strengthColor = ['#3D3762', '#EF4444', '#F59E0B', '#10B981'][strength] || '#3D3762';

  // --- STEP 1: SEND & VERIFY OTP ---
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setPhoneError('');
    setGeneralError('');
    setExistingUserFound(false);

    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (!cleanPhone) {
      setPhoneError('Mobile number is required');
      return;
    }
    if (cleanPhone.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await api.post('/auth/send-otp', {
        phone: cleanPhone,
        type: 'user',
      });
      if (res.success) {
        setOtpSent(true);
        setOtpCode('');
        setOtpError('');
        setCountdown(30);
      } else {
        const msg = res.message || 'Failed to send SMS verification code';
        if (msg.toLowerCase().includes('already exists')) {
          setExistingUserFound(true);
          setPhoneError('This phone number is already registered.');
        } else {
          setGeneralError(msg);
        }
      }
    } catch (err) {
      const msg = err.message || 'Failed to send SMS verification code';
      if (msg.toLowerCase().includes('already exists')) {
        setExistingUserFound(true);
        setPhoneError('This phone number is already registered.');
      } else {
        setGeneralError(msg);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setOtpError('');
    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setOtpError('Please enter the 6-digit verification code');
      return;
    }
    if (cleanOtp.length < 6) {
      setOtpError('Verification code must be 6 digits');
      return;
    }

    setOtpLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        phone: phone.trim().replace(/\D/g, ''),
        otp: cleanOtp,
      });
      if (res.success) {
        setPhoneVerified(true);
        setTimeout(() => {
          setCurrentStep(2);
        }, 400);
      } else {
        setOtpError(res.message || 'Invalid verification code');
      }
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired SMS code');
    } finally {
      setOtpLoading(false);
    }
  };

  // --- STEP 2: PROFILE DETAILS ---
  const handleProceedToLocation = (e) => {
    if (e) e.preventDefault();
    setNameError('');
    setEmailError('');
    let hasErr = false;

    if (!name.trim()) {
      setNameError('Full name is required');
      hasErr = true;
    } else if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters');
      hasErr = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email address is required');
      hasErr = true;
    } else if (!emailRegex.test(email.trim())) {
      setEmailError('Please enter a valid email address');
      hasErr = true;
    }

    if (hasErr) return;
    setCurrentStep(3);
  };

  // --- STEP 3: LOCATION DETAILS ---
  const handleProceedToPassword = (e) => {
    if (e) e.preventDefault();
    setLocationError('');
    if (!districtId) {
      setLocationError('Please select your district');
      return;
    }
    if (!mandalId) {
      setLocationError('Please select your mandal');
      return;
    }
    setCurrentStep(4);
  };

  // --- STEP 4: PASSWORD & FINISH ---
  const handleCompleteRegistration = async (e) => {
    if (e) e.preventDefault();
    setPasswordError('');
    setConfirmError('');
    setGeneralError('');
    let hasErr = false;

    if (!password) {
      setPasswordError('Password is required');
      hasErr = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasErr = true;
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your password');
      hasErr = true;
    } else if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      hasErr = true;
    }

    if (hasErr) return;

    setLoading(true);
    const cleanPhone = phone.trim().replace(/\D/g, '');
    try {
      await signup(
        name.trim(),
        cleanPhone,
        password,
        referralCode.trim() ? referralCode.trim().toUpperCase() : undefined,
        districtId,
        mandalId,
        address.trim() || null,
        email.trim(),
        otpCode.trim()
      );
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setGeneralError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedDistrictName = districts.find((d) => d.id === districtId)?.name || '';
  const selectedMandalName = mandals.find((m) => m.id === mandalId)?.name || '';

  return (
    <div className="auth-page-container container" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="auth-card glass-card animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '32px 28px' }}>
        {/* Header with Step Tracker */}
        <div className="auth-header" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {currentStep === 1 && 'Step 1 of 4: Verify your mobile phone with SMS OTP'}
            {currentStep === 2 && 'Step 2 of 4: Enter your name and email address'}
            {currentStep === 3 && 'Step 3 of 4: Choose your district and mandal'}
            {currentStep === 4 && 'Step 4 of 4: Create a secure password for sign-in'}
          </p>
        </div>

        {/* Modern Stepper Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.05em' }}>
              STEP {currentStep} OF 4
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              {currentStep === 1 && 'Mobile Verification'}
              {currentStep === 2 && 'Personal Details'}
              {currentStep === 3 && 'Location Setup'}
              {currentStep === 4 && 'Account Security'}
            </span>
          </div>

          <div style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${currentStep * 25}%`,
                background: 'linear-gradient(90deg, #F0C38E 0%, #F1AA9B 100%)',
                borderRadius: '3px',
                transition: 'width 0.3s ease'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            {[
              { num: 1, label: 'Mobile' },
              { num: 2, label: 'Profile' },
              { num: 3, label: 'Location' },
              { num: 4, label: 'Security' }
            ].map((s) => (
              <div key={s.num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    backgroundColor: s.num < currentStep ? 'var(--primary)' : s.num === currentStep ? '#312C51' : 'rgba(255,255,255,0.06)',
                    border: s.num === currentStep ? '2px solid var(--primary)' : s.num < currentStep ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: s.num < currentStep ? '#0A0F1D' : s.num === currentStep ? 'var(--primary)' : 'var(--text-secondary)',
                    marginBottom: '4px'
                  }}
                >
                  {s.num < currentStep ? '✓' : s.num}
                </div>
                <span style={{ fontSize: '0.72rem', color: s.num <= currentStep ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: s.num === currentStep ? '700' : '500' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {generalError && (
          <div className="auth-error-banner" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '18px' }}>
            <ShieldAlert size={16} />
            <span>{generalError}</span>
          </div>
        )}

        {/* STEP 1: MOBILE & OTP VERIFICATION */}
        {currentStep === 1 && (
          <div>
            {existingUserFound && (
              <div style={{ backgroundColor: 'rgba(240, 195, 142, 0.12)', border: '1px solid var(--primary)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '700', fontSize: '0.92rem', marginBottom: '6px' }}>
                  <ShieldCheck size={18} />
                  <span>Account Already Exists!</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '14px', lineHeight: '1.4' }}>
                  A Go Fixit account with this mobile number already exists. Would you like to log in with your Password or an SMS OTP?
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <Link
                    to={`/login?phone=${encodeURIComponent(phone.trim())}&method=otp`}
                    className="btn btn-primary"
                    style={{ fontSize: '0.82rem', padding: '8px 10px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                  >
                    <Smartphone size={14} />
                    <span>Sign In (OTP)</span>
                  </Link>
                  <Link
                    to={`/login?phone=${encodeURIComponent(phone.trim())}&method=password`}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '8px 10px', textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                  >
                    <KeyRound size={14} />
                    <span>Sign In (Password)</span>
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={!otpSent ? handleSendOtp : handleVerifyOtp} className="auth-form">
              <div className="form-group">
                <label htmlFor="reg-phone">Mobile Phone Number</label>
                <div className="input-with-icon" style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '12px', fontWeight: '700', fontSize: '0.85rem', color: 'var(--primary)', zIndex: 1 }}>
                    +91
                  </span>
                  <input
                    type="tel"
                    id="reg-phone"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      setPhoneError('');
                      setExistingUserFound(false);
                    }}
                    placeholder="Enter 10-digit mobile number"
                    maxLength={10}
                    style={{ paddingLeft: '48px' }}
                    required
                    disabled={otpLoading || otpSent}
                  />
                  {phoneVerified && <CheckCircle2 size={18} color="#10B981" style={{ position: 'absolute', right: '12px' }} />}
                </div>
                {phoneError && <span style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{phoneError}</span>}
              </div>

              {otpSent && (
                <div className="form-group animate-slide-up">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label htmlFor="reg-otp" style={{ marginBottom: 0 }}>6-Digit Verification Code</label>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                        setOtpError('');
                      }}
                    >
                      Change Number
                    </button>
                  </div>
                  <div className="input-with-icon">
                    <ShieldCheck className="input-icon" size={16} />
                    <input
                      type="text"
                      id="reg-otp"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value);
                        setOtpError('');
                      }}
                      placeholder="123456"
                      maxLength={6}
                      required
                      style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                      disabled={otpLoading}
                    />
                  </div>
                  {otpError && <span style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{otpError}</span>}

                  <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    {countdown > 0 ? (
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Resend code in <strong style={{ color: 'var(--primary)' }}>{countdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpLoading}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', fontSize: '0.82rem', textDecoration: 'underline' }}
                      >
                        Resend SMS Code
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!otpSent ? (
                <button type="submit" className="btn btn-primary btn-block btn-auth" disabled={otpLoading}>
                  {otpLoading ? <span>Sending Code...</span> : (
                    <>
                      <span>Send SMS Verification Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              ) : (
                <button type="submit" className="btn btn-primary btn-block btn-auth" disabled={otpLoading}>
                  {otpLoading ? <span>Verifying...</span> : (
                    <>
                      <span>Verify Code & Continue</span>
                      <CheckCircle2 size={16} />
                    </>
                  )}
                </button>
              )}
            </form>
          </div>
        )}

        {/* STEP 2: PERSONAL INFORMATION */}
        {currentStep === 2 && (
          <form onSubmit={handleProceedToLocation} className="auth-form animate-fade-in">
            <div style={{ padding: '8px 12px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10B981', color: '#10B981', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <CheckCircle2 size={16} />
              <span>Mobile Verified: +91 {phone}</span>
            </div>

            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <div className="input-with-icon">
                <User className="input-icon" size={16} />
                <input
                  type="text"
                  id="reg-name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError('');
                  }}
                  placeholder="e.g. Ramesh Kumar"
                  required
                />
              </div>
              {nameError && <span style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{nameError}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Email Address</label>
              <div className="input-with-icon">
                <Mail className="input-icon" size={16} />
                <input
                  type="email"
                  id="reg-email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                  }}
                  placeholder="e.g. ramesh@example.com"
                  required
                />
              </div>
              {emailError && <span style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{emailError}</span>}
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label htmlFor="reg-ref" style={{ marginBottom: 0 }}>Referral Code</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>Optional - Get ₹50 Bonus</span>
              </div>
              <div className="input-with-icon">
                <Gift className="input-icon" size={16} />
                <input
                  type="text"
                  id="reg-ref"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="e.g. NGPC-1234"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: '0 0 auto', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span>Continue to Location</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: LOCATION DETAILS */}
        {currentStep === 3 && (
          <form onSubmit={handleProceedToPassword} className="auth-form animate-fade-in">
            {locationError && (
              <div className="auth-error-banner" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '14px' }}>
                <ShieldAlert size={16} />
                <span>{locationError}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="reg-district">District</label>
              <div className="input-with-icon">
                <Map className="input-icon" size={16} />
                <select
                  id="reg-district"
                  value={districtId}
                  onChange={(e) => {
                    setDistrictId(e.target.value);
                    setMandalId('');
                    setLocationError('');
                  }}
                  className="form-control"
                  style={{
                    paddingLeft: '40px',
                    width: '100%',
                    height: '44px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                  required
                >
                  <option value="">Select District</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-mandal">Mandal</label>
              <div className="input-with-icon">
                <MapPin className="input-icon" size={16} />
                <select
                  id="reg-mandal"
                  value={mandalId}
                  onChange={(e) => {
                    setMandalId(e.target.value);
                    setLocationError('');
                  }}
                  disabled={!districtId}
                  className="form-control"
                  style={{
                    paddingLeft: '40px',
                    width: '100%',
                    height: '44px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: !districtId ? 'rgba(255,255,255,0.04)' : 'var(--bg-secondary)',
                    color: 'var(--text-primary)'
                  }}
                  required
                >
                  <option value="">{districtId ? 'Select Mandal' : 'Choose District first'}</option>
                  {mandals.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-address">Address / Landmark (Optional)</label>
              <div className="input-with-icon">
                <MapPin className="input-icon" size={16} />
                <input
                  type="text"
                  id="reg-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Door No, Street Name, Landmark"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: '0 0 auto', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setCurrentStep(2)}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <span>Continue to Security</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: PASSWORD & COMPLETION */}
        {currentStep === 4 && (
          <form onSubmit={handleCompleteRegistration} className="auth-form animate-fade-in">
            {/* Overview Card */}
            <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px', marginBottom: '18px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Account Summary
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>Mobile:</span> +91 {phone} (✓)</div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Name:</span> {name}</div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Location:</span> {selectedMandalName}, {selectedDistrictName}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-pwd">Create Password</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <KeyRound className="input-icon" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="reg-pwd"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  placeholder="At least 6 characters"
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0, display: 'flex'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {password.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <div style={{ flex: 1, height: '4px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(strength / 3) * 100}%`, backgroundColor: strengthColor }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: strengthColor }}>{strengthLabel}</span>
                </div>
              )}
              {passwordError && <span style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{passwordError}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm">Confirm Password</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <KeyRound className="input-icon" size={16} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="reg-confirm"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmError('');
                  }}
                  placeholder="Re-enter password"
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', padding: 0, display: 'flex'
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmError && <span style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>{confirmError}</span>}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: '0 0 auto', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setCurrentStep(3)}
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} disabled={loading}>
                {loading ? <span>Completing Registration...</span> : (
                  <>
                    <span>Complete Registration</span>
                    <Sparkles size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer-text" style={{ marginTop: '22px' }}>
          Already have an account? <Link to={`/login?phone=${encodeURIComponent(phone.trim())}`}>Sign In here</Link>
        </div>
      </div>
    </div>
  );
}
