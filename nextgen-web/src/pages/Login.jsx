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

  // Forgot Password / Reset Password states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

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
        setError(`success:SMS verification code sent to mobile ending in ${res.phone || 'phone'}`);
      } else {
        setError(res.message || 'Failed to send SMS verification code');
      }
    } catch (err) {
      setError(err.message || 'Failed to send SMS verification code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    if (!phoneOrEmail) {
      setError('Registered phone number is required');
      return;
    }
    setError('');
    setResetLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phoneOrEmail: phoneOrEmail.trim(), type: 'user', action: 'reset' });
      if (res.success) {
        setResetOtpSent(true);
        setError(`success:SMS reset code sent to mobile ending in ${res.phone || 'phone'}`);
      } else {
        setError(res.message || 'Failed to send SMS reset code');
      }
    } catch (err) {
      setError(err.message || 'Failed to send SMS reset code');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetOtp.trim()) {
      setError('Please enter the 6-digit SMS code');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setResetLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        phoneOrEmail: phoneOrEmail.trim(),
        otp: resetOtp.trim(),
        newPassword,
        type: 'user'
      });
      if (res.success) {
        setError('success:Password reset successfully! Please log in.');
        setIsForgotPassword(false);
        setResetOtpSent(false);
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setLoginMethod('password');
      } else {
        setError(res.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
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
          <h2>{isForgotPassword ? 'Reset Password' : 'Welcome Back'}</h2>
          <p>{isForgotPassword ? 'Reset password via Mobile SMS verification code' : 'Sign in to manage your bookings and slot subscriptions'}</p>
        </div>

        {error && (
          <div className={`auth-error-banner ${error.startsWith('success:') ? 'success-banner' : ''}`} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ShieldAlert size={16} className="error-icon" />
            <span>{error.startsWith('success:') ? error.replace('success:', '') : error}</span>
          </div>
        )}

        {isForgotPassword ? (
          <form onSubmit={!resetOtpSent ? handleSendResetOtp : handleResetPasswordSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="phoneOrEmail">Registered Phone Number</label>
              <div className="input-with-icon">
                <Phone className="input-icon" size={16} />
                <input
                  type="text"
                  id="phoneOrEmail"
                  value={phoneOrEmail}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  placeholder="Enter registered phone number"
                  required
                  disabled={resetLoading || resetOtpSent}
                />
              </div>
            </div>

            {resetOtpSent && (
              <>
                <div className="form-group animate-slide-up">
                  <label htmlFor="resetOtp">SMS Verification Code (OTP)</label>
                  <div className="input-with-icon">
                    <ShieldCheck className="input-icon" size={16} />
                    <input
                      type="text"
                      id="resetOtp"
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      placeholder="6-digit SMS OTP"
                      maxLength={6}
                      required
                      disabled={resetLoading}
                    />
                  </div>
                </div>

                <div className="form-group animate-slide-up">
                  <label htmlFor="newPassword">New Password</label>
                  <div className="input-with-icon">
                    <KeyRound className="input-icon" size={16} />
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      required
                      disabled={resetLoading}
                    />
                  </div>
                </div>

                <div className="form-group animate-slide-up">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="input-with-icon">
                    <KeyRound className="input-icon" size={16} />
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      disabled={resetLoading}
                    />
                  </div>
                </div>
              </>
            )}

            {!resetOtpSent ? (
              <button type="submit" className="btn btn-primary btn-block btn-auth" disabled={resetLoading}>
                {resetLoading ? <span>Sending Code...</span> : <span>Send Reset SMS OTP</span>}
              </button>
            ) : (
              <button type="submit" className="btn btn-primary btn-block btn-auth" disabled={resetLoading}>
                {resetLoading ? <span>Updating Password...</span> : <span>Set New Password</span>}
              </button>
            )}

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                type="button"
                className="link-btn"
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}
                onClick={() => { setIsForgotPassword(false); setResetOtpSent(false); }}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          <>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}
                      onClick={() => { setIsForgotPassword(true); setResetOtpSent(false); }}
                    >
                      Forgot Password?
                    </button>
                  </div>
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
                    <label htmlFor="otp">Verification Code (SMS OTP)</label>
                    <div className="input-with-icon">
                      <ShieldCheck className="input-icon" size={16} />
                      <input
                        type="text"
                        id="otp"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        placeholder="Enter 6-digit SMS verification code"
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
                      <span>Send Mobile SMS OTP</span>
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
                {loginMethod === 'password' ? 'Sign In with Mobile SMS OTP' : 'Sign In with Password'}
              </button>
            </div>

            <div className="auth-footer-text">
              Don't have an account? <Link to="/signup">Register here</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
