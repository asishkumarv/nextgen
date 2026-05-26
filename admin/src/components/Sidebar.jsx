import React from 'react';
import { LayoutDashboard, Users, CreditCard, CalendarRange, Wrench, LogOut, Briefcase, Coins } from 'lucide-react';
import { removeAuthToken, removeAdminProfile } from '../utils/api';
import logo from '../assets/logo.png';

export default function Sidebar({ activeView, onViewChange, onLogout, adminName }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users Directory', icon: Users },
    { id: 'subscribers', label: 'Subscribers Slot', icon: CreditCard },
    { id: 'bookings', label: 'Bookings List', icon: CalendarRange },
    { id: 'services', label: 'Services Manager', icon: Wrench },
    { id: 'vendors', label: 'Vendors Manager', icon: Briefcase },
    { id: 'settlements', label: 'Payment Settlements', icon: Coins },
  ];

  const handleLogoutClick = () => {
    removeAuthToken();
    removeAdminProfile();
    onLogout();
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.branding}>
        <img src={logo} alt="NextGen Logo" style={styles.logoImage} />
        <div style={styles.brandingText}>
          <h2 style={styles.brandTitle}>NextGen</h2>
          <span style={styles.brandSubtitle}>Admin Console</span>
        </div>
      </div>

      <nav style={styles.nav}>
        <div style={styles.menuGroup}>
          <span style={styles.groupLabel}>Main Operations</span>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                style={{
                  ...styles.navButton,
                  ...(isActive ? styles.navButtonActive : {}),
                }}
              >
                <Icon size={20} color={isActive ? '#FFFFFF' : '#9CA3AF'} />
                <span>{item.label}</span>
                {isActive && <div style={styles.activeIndicator} />}
              </button>
            );
          })}
        </div>
      </nav>

      <div style={styles.footer}>
        <div style={styles.profileSection}>
          <div style={styles.avatar}>
            {adminName ? adminName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AD'}
          </div>
          <div style={styles.profileInfo}>
            <p style={styles.profileName}>{adminName || 'Admin User'}</p>
            <span style={styles.profileRole}>System Admin</span>
          </div>
        </div>
        
        <button onClick={handleLogoutClick} style={styles.logoutButton}>
          <LogOut size={18} />
          <span>Exit Console</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: '#1F2937',
    color: '#F9FAFB',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    borderRight: '1px solid #374151',
    flexShrink: 0,
    zIndex: 100,
  },
  branding: {
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #374151',
  },
  logoImage: {
    width: '40px',
    height: '40px',
    objectFit: 'contain',
    flexShrink: 0,
    filter: 'drop-shadow(0 2px 6px rgba(0, 184, 148, 0.4))',
  },
  brandingText: {
    display: 'flex',
    flexDirection: 'column',
  },
  brandTitle: {
    fontSize: '1.15rem',
    fontWeight: '800',
    letterSpacing: '-0.3px',
    lineHeight: '1.2',
  },
  brandSubtitle: {
    fontSize: '0.72rem',
    color: '#9CA3AF',
    fontWeight: '600',
  },
  nav: {
    flex: 1,
    padding: '24px 16px',
  },
  menuGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  groupLabel: {
    fontSize: '0.68rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#6B7280',
    letterSpacing: '0.08em',
    paddingLeft: '12px',
    marginBottom: '8px',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 14px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#9CA3AF',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  navButtonActive: {
    backgroundColor: '#00B894',
    color: '#FFFFFF',
    boxShadow: '0 4px 10px rgba(0, 184, 148, 0.25)',
  },
  activeIndicator: {
    position: 'absolute',
    right: '8px',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#FFFFFF',
  },
  footer: {
    padding: '20px 16px',
    borderTop: '1px solid #374151',
    backgroundColor: '#111827',
  },
  profileSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    padding: '4px 6px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #0984E3 0%, #00B894 100%)',
    color: '#FFFFFF',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '800',
    fontSize: '0.95rem',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  profileName: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#F9FAFB',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  profileRole: {
    fontSize: '0.7rem',
    color: '#9CA3AF',
    fontWeight: '600',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px',
    width: '100%',
    borderRadius: '8px',
    border: '1px solid #374151',
    backgroundColor: 'transparent',
    color: '#EF4444',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
