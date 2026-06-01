import React from 'react';
import { Menu, Calendar, Bell, RotateCw, LogOut } from 'lucide-react';

export default function Header({ activeView, sidebarOpen, onToggleSidebar, adminName, onRefresh }) {
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

        <button onClick={onRefresh} className="admin-header-notification" title="Refresh Page Data">
          <RotateCw size={18} color="#4B5563" />
        </button>

        <button className="admin-header-notification" title="System Logs">
          <Bell size={18} color="#4B5563" />
          <span className="admin-header-badge-dot" />
        </button>

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
