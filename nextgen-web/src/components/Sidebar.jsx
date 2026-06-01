import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Wrench, Wallet, User } from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Book Service', path: '/services', icon: <Wrench size={20} /> },
    { name: 'Subscription Slots', path: '/slots', icon: <Calendar size={20} /> },
    { name: 'Wallet & Referrals', path: '/referrals', icon: <Wallet size={20} /> },
    { name: 'My Profile', path: '/profile', icon: <User size={20} /> },
  ];

  return (
    <aside className="desktop-sidebar">
      <div className="sidebar-menu">
        <div className="sidebar-title">Manage Account</div>
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`sidebar-link ${isActive(link.path) ? 'active' : ''}`}
          >
            {link.icon}
            <span>{link.name}</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
