import React from 'react';
import { Menu, Calendar, Bell } from 'lucide-react';

export default function Header({ activeView, sidebarOpen, onToggleSidebar, adminName }) {
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

        <button className="admin-header-notification" title="System Logs">
          <Bell size={18} color="#4B5563" />
          <span className="admin-header-badge-dot" />
        </button>

        <div className="admin-header-divider" />

        <div className="admin-header-user-info">
          <span className="admin-header-user-name">{adminName || 'Admin'}</span>
          <span className="admin-header-status">Online</span>
        </div>
      </div>
    </header>
  );
}
