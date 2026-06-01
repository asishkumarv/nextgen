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
import Settlements from './pages/Settlements';
import Districts from './pages/Districts';
import Mandals from './pages/Mandals';
import SubscriptionRequests from './pages/SubscriptionRequests';
import Withdrawals from './pages/Withdrawals';

export default function App() {
  const [admin, setAdmin] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
        return <Dashboard key={refreshKey} onNavigateToView={setActiveView} />;
      case 'users':
        return <Users key={refreshKey} />;
      case 'districts':
        return <Districts key={refreshKey} />;
      case 'mandals':
        return <Mandals key={refreshKey} />;
      case 'subscribers':
        return <Subscribers key={refreshKey} />;
      case 'requests':
        return <SubscriptionRequests key={refreshKey} />;
      case 'bookings':
        return <Bookings key={refreshKey} />;
      case 'services':
        return <Services key={refreshKey} />;
      case 'vendors':
        return <Vendors key={refreshKey} />;
      case 'settlements':
        return <Settlements key={refreshKey} />;
      case 'withdrawals':
        return <Withdrawals key={refreshKey} />;
      default:
        return <Dashboard key={refreshKey} onNavigateToView={setActiveView} />;
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
          onRefresh={() => setRefreshKey(prev => prev + 1)}
        />
        
        <div className="view-container">
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
}
