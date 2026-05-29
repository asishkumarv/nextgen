import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { User, Phone, Key, Shield, CheckCircle, AlertTriangle, RefreshCw, LogOut, HelpCircle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [editLoading, setEditLoading] = useState(false);
  
  // Password Change States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Status Alerts
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Extract initials (e.g. "Ravi Kumar" -> "RK")
  const getInitials = (userName) => {
    if (!userName) return 'U';
    const parts = userName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return userName.slice(0, 2).toUpperCase();
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('Name and phone fields are required.');
      return;
    }

    setEditLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.put('/auth/profile', { name, phone });
      setSuccessMsg('Profile updated successfully.');
      await refreshProfile();
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setErrorMsg(err.message || 'Failed to update profile details.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMsg('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters.');
      return;
    }

    setPasswordLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setSuccessMsg('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Error changing password:', err);
      setErrorMsg(err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="profile-page container">
      <div className="section-title-row">
        <h1 className="dashboard-title">My Profile</h1>
        <p className="dashboard-subtitle">Manage your personal information, security credentials, and preferences.</p>
      </div>

      {successMsg && <div className="banner success-banner"><CheckCircle size={18} /> <span>{successMsg}</span></div>}
      {errorMsg && <div className="banner error-banner"><AlertTriangle size={18} /> <span>{errorMsg}</span></div>}

      <div className="profile-grid">
        {/* Left Card: Account Card Overview */}
        <div className="profile-card-left-col">
          <div className="user-overview-card glass-card text-center">
            <div className="large-avatar-gradient">
              <span>{getInitials(user?.name)}</span>
            </div>
            
            <h2 className="overview-name">{user?.name}</h2>
            <p className="overview-phone">{user?.phone}</p>
            {user?.subscription && (
              <span className="badge-member badge-member-large">PRO MEMBER</span>
            )}

            <div className="profile-links-list">
              <button onClick={() => navigate('/dashboard')} className="btn btn-secondary btn-block">
                Go to Dashboard
              </button>
              <button onClick={() => { logout(); navigate('/'); }} className="btn btn-danger-outline btn-block">
                <LogOut size={16} />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Active Subscription Summary card */}
          <div className="profile-sub-summary-card glass-card">
            <h3>Active Subscription Status</h3>
            {user?.subscription ? (
              <div className="sub-summary-active">
                <Shield className="sub-icon text-gradient" size={24} />
                <div>
                  <h4>{user.subscription.plan}</h4>
                  <p>Mandal: <strong>{user.subscription.mandalName}</strong></p>
                  <p>Slot Selected: <strong>Slot #{user.subscription.slotNumber}</strong></p>
                </div>
              </div>
            ) : (
              <div className="sub-summary-inactive">
                <p>No active subscription slot reserved.</p>
                <button onClick={() => navigate('/slots')} className="btn btn-primary btn-sm btn-block">
                  Subscribe Now
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Actionable Edit and Security cards */}
        <div className="profile-card-right-col">
          {/* Edit Profile Form Card */}
          <div className="settings-card glass-card">
            <div className="settings-card-header">
              <h3>Profile Settings</h3>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="btn btn-secondary btn-sm">
                  Edit Details
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="profile-settings-form">
                <div className="form-group">
                  <label htmlFor="name-input">Full Name</label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={16} />
                    <input
                      type="text"
                      id="name-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter name"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone-input">Phone Number</label>
                  <div className="input-with-icon">
                    <Phone className="input-icon" size={16} />
                    <input
                      type="text"
                      id="phone-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>

                <div className="step-navigation-buttons">
                  <button type="button" onClick={() => { setIsEditing(false); setName(user?.name || ''); setPhone(user?.phone || ''); }} className="btn btn-secondary-outline" disabled={editLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={editLoading}>
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details-display">
                <div className="details-display-item">
                  <span className="label">Registered Name</span>
                  <span className="value">{user?.name}</span>
                </div>
                <div className="details-display-item">
                  <span className="label">Phone Contact</span>
                  <span className="value">{user?.phone}</span>
                </div>
              </div>
            )}
          </div>

          {/* Change Password Form Card */}
          <div className="settings-card glass-card">
            <div className="settings-card-header">
              <h3>Security Settings</h3>
            </div>

            <form onSubmit={handleChangePassword} className="security-settings-form">
              <div className="form-group">
                <label htmlFor="current-pass">Current Password</label>
                <div className="input-with-icon">
                  <Lock className="input-icon" size={16} />
                  <input
                    type="password"
                    id="current-pass"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="new-pass">New Password</label>
                <div className="input-with-icon">
                  <Key className="input-icon" size={16} />
                  <input
                    type="password"
                    id="new-pass"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-pass">Confirm New Password</label>
                <div className="input-with-icon">
                  <Key className="input-icon" size={16} />
                  <input
                    type="password"
                    id="confirm-pass"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retype new password"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={passwordLoading} style={{ marginTop: '12px' }}>
                {passwordLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
