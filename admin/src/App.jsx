import React, { useState, useEffect } from 'react';
import './App.css';
import { getAdminProfile } from './utils/api';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Subscribers from './pages/Subscribers';
import Bookings from './pages/Bookings';
import Services from './pages/Services';
import Vendors from './pages/Vendors';

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const profile = getAdminProfile();
    if (profile) {
      setAdmin(profile);
    }
  }, []);

  const handleLoginSuccess = (profile) => {
    setAdmin(profile);
  };

  const handleLogout = () => {
    setAdmin(null);
    setActiveView('dashboard');
  };

  if (!admin) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onNavigateToView={setActiveView} />;
      case 'users':
        return <Users />;
      case 'subscribers':
        return <Subscribers />;
      case 'bookings':
        return <Bookings />;
      case 'services':
        return <Services />;
      case 'vendors':
        return <Vendors />;
      default:
        return <Dashboard onNavigateToView={setActiveView} />;
    }
  };

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Sidebar Backdrop overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <Sidebar
        activeView={activeView}
        onViewChange={(view) => {
          setActiveView(view);
          setSidebarOpen(false); // Close sidebar on mobile select
        }}
        onLogout={handleLogout}
        adminName={admin.name}
      />

      {/* Main Panel Content Container */}
      <main className="main-content">
        <Header
          activeView={activeView}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          adminName={admin.name}
        />
        
        <div className="view-container">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
}
