import React, { useState, useEffect, useRef } from 'react';
import { Menu, Calendar, Bell, RotateCw, LogOut } from 'lucide-react';
import { api } from '../utils/api';

export default function Header({ activeView, sidebarOpen, onToggleSidebar, adminName, onRefresh, onNavigateToView }) {
  const [notifications, setNotifications] = useState({ vendors: 0, settlements: 0, withdrawals: 0, subscriptions: 0 });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.get('/admin/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRefresh = () => {
    fetchNotifications();
    if (onRefresh) onRefresh();
  };

  const handleNotificationClick = (view) => {
    if (onNavigateToView) {
      onNavigateToView(view);
      setShowDropdown(false);
    }
  };

  const totalNotifications = Object.values(notifications).reduce((a, b) => a + b, 0);

  const getPageTitle = () => {
    switch (activeView) {
      case 'dashboard':
        return 'System Dashboard';
      case 'users':
        return 'Users Directory';
      case 'subscribers':
        return 'Active Subscribers';
      case 'bookings':
        return 'Bookings Registry';
      case 'services':
        return 'Services Manager';
      case 'vendors':
        return 'Vendors Manager';
      case 'settlements':
        return 'Payment Settlements';
      case 'enquiries':
        return 'Customer Enquiries';
      default:
        return 'Admin Panel';
    }
  };

  const getTodayDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <header className="admin-header">
      <div className="admin-header-left">
        <button onClick={onToggleSidebar} className="admin-header-hamburger" title="Toggle Sidebar">
          <Menu size={20} color="#374151" />
        </button>
        <h1 className="admin-header-title">{getPageTitle()}</h1>
      </div>

      <div className="admin-header-right">
        <div className="admin-header-date">
          <Calendar size={16} color="#6B7280" />
          <span>{getTodayDate()}</span>
        </div>

        <button onClick={handleRefresh} className="admin-header-notification" title="Refresh Page Data">
          <RotateCw size={18} color="#4B5563" />
        </button>

        <div className="notification-wrapper" ref={dropdownRef}>
          <button 
            className="admin-header-notification" 
            title="Notifications"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <Bell size={18} color="#4B5563" />
            {totalNotifications > 0 && <span className="admin-header-badge-dot" />}
          </button>
          
          {showDropdown && (
            <div className="notification-dropdown">
              <div className="notification-dropdown-header">
                <h4>Notifications</h4>
                <span>{totalNotifications} New</span>
              </div>
              <div className="notification-dropdown-body">
                {notifications.vendors > 0 && (
                  <div className="notification-item" onClick={() => handleNotificationClick('vendors')}>
                    <span className="notification-icon vendor">V</span>
                    <div className="notification-content">
                      <p>Vendor Registrations</p>
                      <span>{notifications.vendors} pending</span>
                    </div>
                  </div>
                )}
                {notifications.settlements > 0 && (
                  <div className="notification-item" onClick={() => handleNotificationClick('settlements')}>
                    <span className="notification-icon settlement">$</span>
                    <div className="notification-content">
                      <p>Payment Requests</p>
                      <span>{notifications.settlements} pending</span>
                    </div>
                  </div>
                )}
                {notifications.withdrawals > 0 && (
                  <div className="notification-item" onClick={() => handleNotificationClick('withdrawals')}>
                    <span className="notification-icon withdrawal">W</span>
                    <div className="notification-content">
                      <p>Referral Withdrawals</p>
                      <span>{notifications.withdrawals} pending</span>
                    </div>
                  </div>
                )}
                {notifications.subscriptions > 0 && (
                  <div className="notification-item" onClick={() => handleNotificationClick('requests')}>
                    <span className="notification-icon subscription">S</span>
                    <div className="notification-content">
                      <p>Subscription Requests</p>
                      <span>{notifications.subscriptions} pending</span>
                    </div>
                  </div>
                )}
                {totalNotifications === 0 && (
                  <div className="notification-empty">
                    <p>No new notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="admin-header-divider" />

        <div className="admin-header-user-info">
          <span className="admin-header-user-name">{adminName || 'Admin'}</span>
          <span className="admin-header-status">Online</span>
        </div>

        <button onClick={() => {
          if(window.confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminProfile');
            window.location.reload();
          }
        }} className="admin-header-notification" title="Logout" style={{ marginLeft: '12px' }}>
          <LogOut size={18} color="#EF4444" />
        </button>
      </div>
    </header>
  );
}
