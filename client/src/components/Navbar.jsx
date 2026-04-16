import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Package, CalendarDays, PlusCircle, User, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { path: '/', label: 'Browse', icon: Home },
    { path: '/my-items', label: 'My Items', icon: Package },
    { path: '/bookings', label: 'Bookings', icon: CalendarDays },
    { path: '/items/new', label: 'List Item', icon: PlusCircle },
  ];

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={() => setMobileOpen(false)}>
          <span className="brand-icon">📦</span>
          <span>ShelfNest</span>
        </Link>

        <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
          {links.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`nav-link ${location.pathname === path ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
          <div className="navbar-user" style={{ marginLeft: '0.5rem' }}>
            <Link
              to="/profile"
              className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <div className="user-avatar">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} />
                ) : (
                  getInitials(user?.name)
                )}
              </div>
              <span className="text-sm">{user?.name?.split(' ')[0]}</span>
            </Link>
            <button className="btn btn-ghost btn-sm" onClick={() => { logout(); setMobileOpen(false); }} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        <button className="nav-hamburger" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
}
