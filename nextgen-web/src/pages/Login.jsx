import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Phone, LogIn, ShieldAlert, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { api } from '../utils/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Login states
  const [loginMethod, setLoginMethod] = useState('password'); // 'password' or 'otp'
  const [showOtpField, setShowOtpField] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phoneOrEmail) {
      setError('Phone number or email is required');
      return;
    }
    setError('');
    setOtpLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phoneOrEmail: phoneOrEmail.trim(), type: 'user', action: 'login' });
      if (res.success) {
        setShowOtpField(true);
        setOtp('');
        setError(`success:Verification code sent to registered email ending in ${res.email}`);
      } else {
        setError(res.message || 'Failed to send verification code');
      }
    } catch (err) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneOrEmail) {
      setError('Please fill in all fields');
      return;
    }
    if (loginMethod === 'password') {
      if (!password) {
        setError('Please fill in all fields');
        return;
      }
    } else {
      if (!otp) {
        setError('Please enter the verification code');
        return;
      }
    }
    setError('');
    setLoading(true);
    try {
      await login(
        phoneOrEmail.trim(),
        loginMethod === 'password' ? password : undefined,
        loginMethod === 'otp' ? otp.trim() : undefined
      );
      // AuthContext will update, navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials or login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container container">
      <div className="auth-card glass-card animate-fade-in">
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Sign in to manage your bookings and slot subscriptions</p>
        </div>

        {error && (
          <div className={`auth-error-banner ${error.startsWith('success:') ? 'success-banner' : ''}`} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ShieldAlert size={16} className="error-icon" />
            <span>{error.startsWith('success:') ? error.replace('success:', '') : error}</span>
          </div>
        )}

        <form onSubmit={loginMethod === 'otp' && !showOtpField ? handleSendOtp : handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="phoneOrEmail">Phone Number or Email Address</label>
            <div className="input-with-icon">
              <Phone className="input-icon" size={16} />
              <input
                type="text"
                id="phoneOrEmail"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                placeholder="Enter phone or email"
                required
                disabled={loading || otpLoading}
              />
            </div>
          </div>

          {loginMethod === 'password' ? (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <KeyRound className="input-icon" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{ paddingRight: '40px' }}
                  disabled={loading}
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
            </div>
          ) : (
            showOtpField && (
              <div className="form-group animate-slide-up">
                <label htmlFor="otp">Verification Code (OTP)</label>
                <div className="input-with-icon">
                  <ShieldCheck className="input-icon" size={16} />
                  <input
                    type="text"
                    id="otp"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit verification code"
                    maxLength={6}
                    required
                    style={{ letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                    disabled={loading}
                  />
                </div>
              </div>
            )
          )}

          {loginMethod === 'otp' && !showOtpField ? (
            <button
              type="submit"
              className="btn btn-primary btn-block btn-auth"
              disabled={otpLoading}
            >
              {otpLoading ? (
                <span>Sending Code...</span>
              ) : (
                <>
                  <span>Send OTP Code</span>
                  <LogIn size={16} />
                </>
              )}
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary btn-block btn-auth"
              disabled={loading}
            >
              {loading ? (
                <span>Logging in...</span>
              ) : (
                <>
                  <span>{loginMethod === 'password' ? 'Sign In' : 'Verify & Login'}</span>
                  <LogIn size={16} />
                </>
              )}
            </button>
          )}
        </form>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            className="link-btn"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '0.9rem'
            }}
            onClick={() => {
              setLoginMethod(loginMethod === 'password' ? 'otp' : 'password');
              setShowOtpField(false);
              setOtp('');
              setError('');
            }}
            disabled={loading || otpLoading}
          >
            {loginMethod === 'password' ? 'Sign In with Email OTP' : 'Sign In with Password'}
          </button>
        </div>

        <div className="auth-footer-text">
          Don't have an account? <Link to="/signup">Register here</Link>
        </div>
      </div>
    </div>
  );
}
