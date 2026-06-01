import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, LayoutDashboard, Calendar, Wrench, Shield, Home, Info, PhoneCall, Sun, Moon, User, Wallet } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function Navbar() {
  const { token, logout, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('nextgen_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nextgen_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };
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
    { name: 'Wallet & Referrals', path: '/referrals', icon: <Wallet size={18} /> },
    { name: 'My Profile', path: '/profile', icon: <User size={18} /> },
  ];

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setMobileMenuOpen(false)}>
          <img src={logoImg} alt="NextGen Logo" className="logo-img" />
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
        </div>

        {/* Desktop CTA / Auth buttons */}
        <div className="navbar-auth desktop-only">
          <button onClick={toggleTheme} className="btn-theme-toggle" title="Toggle Theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          {token ? (
            <div className="user-menu">
              <Link to="/referrals" className="user-profile-link" title="My Wallet" style={{ marginRight: '8px' }}>
                <Wallet size={16} style={{ color: 'var(--primary)' }} />
                <span>₹{user?.wallet_balance || 0}</span>
              </Link>
              <Link to="/dashboard" className="user-profile-link" title="Dashboard">
                <User size={16} style={{ color: 'var(--primary)' }} />
                <span>{user?.name || 'Dashboard'}</span>
                {user?.subscription?.status === 'Active' && <span className="badge-member">PRO</span>}
              </Link>
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

        {/* Mobile Header Actions */}
        <div className="mobile-header-actions mobile-only">
          <button onClick={toggleTheme} className="btn-theme-toggle" title="Toggle Theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="mobile-menu-toggle" onClick={toggleMobileMenu} aria-label="Toggle Menu">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
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
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="drawer-user-details-link" style={{ textDecoration: 'none', display: 'block', marginBottom: '12px' }}>
                    <div className="drawer-user-details">
                      <span className="drawer-username">
                        {user?.name}
                        {user?.subscription?.status === 'Active' && <span className="badge-member">PRO</span>}
                      </span>
                      <span className="drawer-phone">{user?.phone}</span>
                    </div>
                  </Link>
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
