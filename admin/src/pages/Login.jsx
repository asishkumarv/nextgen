import React, { useState } from 'react';
import { api, setAuthToken, setAdminProfile } from '../utils/api';
import { Key, Mail, AlertTriangle } from 'lucide-react';
import logo from '../assets/logo.png';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      const data = await api.post('/admin/login', { email, password });
      setAuthToken(data.token);
      setAdminProfile(data.admin);
      onLoginSuccess(data.admin);
    } catch (err) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard} className="animate-fade-in">
        <div style={styles.logoContainer}>
          <img src={logo} alt="NextGen Logo" style={styles.logoImage} />
          <h1 style={styles.title}>NextGen Power Care</h1>
          <p style={styles.subtitle}>Administrator Control Center</p>
        </div>

        {error && (
          <div style={styles.errorAlert}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="input-group">
            <label style={styles.inputLabel}>
              <Mail size={14} style={{ marginRight: 6 }} />
              Admin Email
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="e.g. admin@nextgen.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="input-group">
            <label style={styles.inputLabel}>
              <Key size={14} style={{ marginRight: 6 }} />
              Password
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px', height: '48px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  loginContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #00B894 0%, #0984E3 100%)',
    padding: '20px',
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '24px',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '32px',
    textAlign: 'center',
  },
  logoImage: {
    width: '90px',
    height: '90px',
    objectFit: 'contain',
    marginBottom: '16px',
    filter: 'drop-shadow(0 4px 12px rgba(0, 184, 148, 0.3))',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#6B7280',
    fontWeight: '600',
    marginTop: '4px',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#FEE2E2',
    color: '#EF4444',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '24px',
    border: '1px solid #FCA5A5',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputLabel: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#374151',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
};
