import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Phone, User, UserPlus, ShieldAlert, Eye, EyeOff, Mail, MapPin, Map } from 'lucide-react';
import { api } from '../utils/api';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [mandalId, setMandalId] = useState('');
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const location = useLocation();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }

    const fetchDistricts = async () => {
      try {
        const data = await api.get('/subscription/districts');
        setDistricts(data);
      } catch (err) {
        console.error('Failed to load districts:', err);
      }
    };
    fetchDistricts();
  }, [location.search]);

  React.useEffect(() => {
    const fetchMandals = async () => {
      if (!districtId) {
        setMandals([]);
        return;
      }
      try {
        const data = await api.get(`/subscription/mandals?districtId=${districtId}`);
        setMandals(data);
      } catch (err) {
        console.error('Failed to load mandals:', err);
      }
    };
    fetchMandals();
  }, [districtId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await signup(name, phone, password, referralCode || undefined, districtId || null, mandalId || null, address || null, email || null);
      // Success, route to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Phone number might be already in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container container">
      <div className="auth-card glass-card animate-fade-in">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join NextGen PowerCare to schedule priority electrical services</p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <ShieldAlert size={16} className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-with-icon">
              <User className="input-icon" size={16} />
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="input-with-icon">
              <Phone className="input-icon" size={16} />
              <input
                type="text"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={16} />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address (optional)"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="district">District</label>
            <div className="input-with-icon">
              <Map className="input-icon" size={16} />
              <select
                id="district"
                value={districtId}
                onChange={(e) => {
                  setDistrictId(e.target.value);
                  setMandalId(''); // Reset mandal when district changes
                }}
                className="form-control"
                style={{ paddingLeft: '40px', width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: '#F9FAFB' }}
              >
                <option value="">Select District (Optional)</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="mandal">Mandal</label>
            <div className="input-with-icon">
              <MapPin className="input-icon" size={16} />
              <select
                id="mandal"
                value={mandalId}
                onChange={(e) => setMandalId(e.target.value)}
                disabled={!districtId}
                className="form-control"
                style={{ paddingLeft: '40px', width: '100%', height: '42px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: !districtId ? '#E5E7EB' : '#F9FAFB' }}
              >
                <option value="">Select Mandal (Optional)</option>
                {mandals.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Address</label>
            <div className="input-with-icon">
              <MapPin className="input-icon" size={16} />
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address (optional)"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <KeyRound className="input-icon" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
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
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <KeyRound className="input-icon" size={16} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Retype password"
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
          </div>

          <div className="form-group">
            <label htmlFor="referralCode">Referral Code (Optional)</label>
            <div className="input-with-icon">
              <UserPlus className="input-icon" size={16} />
              <input
                type="text"
                id="referralCode"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Enter 7-digit code"
                maxLength={7}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-auth"
            disabled={loading}
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Register</span>
                <UserPlus size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-text">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
