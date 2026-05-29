import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, LayoutDashboard, Calendar, Wrench, Shield, Home, Info, PhoneCall } from 'lucide-react';

export default function Navbar() {
  const { token, logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const publicLinks = [
    { name: 'Home', path: '/', icon: <Home size={18} /> },
    { name: 'About', path: '/about', icon: <Info size={18} /> },
    { name: 'Contact', path: '/contact', icon: <PhoneCall size={18} /> },
  ];

  const protectedLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Book Service', path: '/services', icon: <Wrench size={18} /> },
    { name: 'Subscription Slots', path: '/slots', icon: <Calendar size={18} /> },
  ];

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setMobileMenuOpen(false)}>
          <Shield className="logo-icon" />
          <span>NextGen <span className="logo-accent">PowerCare</span></span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="navbar-links desktop-only">
          {publicLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-link ${isActive(link.path) ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          ))}

          {token && protectedLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`navbar-link ${isActive(link.path) ? 'active' : ''}`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Desktop CTA / Auth buttons */}
        <div className="navbar-auth desktop-only">
          {token ? (
            <div className="user-menu">
              <span className="user-greeting">
                Hello, <strong>{user?.name || 'User'}</strong>
                {user?.subscription && <span className="badge-member">PRO</span>}
              </span>
              <button onClick={handleLogout} className="btn-logout" title="Log Out">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login-link">Sign In</Link>
              <Link to="/signup" className="btn-signup-link">Register</Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-toggle mobile-only" onClick={toggleMobileMenu} aria-label="Toggle Menu">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-slide-down">
          <div className="mobile-drawer-links">
            <div className="drawer-section-title">Explore</div>
            {publicLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`drawer-link ${isActive(link.path) ? 'active' : ''}`}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}

            {token ? (
              <>
                <div className="drawer-section-title">Dashboard & Actions</div>
                {protectedLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`drawer-link ${isActive(link.path) ? 'active' : ''}`}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                ))}
                
                <div className="drawer-user-info">
                  <div className="drawer-user-details">
                    <span className="drawer-username">{user?.name}</span>
                    <span className="drawer-phone">{user?.phone}</span>
                  </div>
                  <button onClick={handleLogout} className="btn-drawer-logout">
                    <LogOut size={18} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="mobile-drawer-auth">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-mobile-login">
                  Sign In
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="btn-mobile-signup">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
