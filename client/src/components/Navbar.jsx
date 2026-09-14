import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LocationPicker from './LocationPicker';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/',         label: 'Home',    icon: 'home' },
    { path: '/my-items', label: 'My Items', icon: 'inventory_2' },
    { path: '/bookings', label: 'Rentals',  icon: 'handyman' },
    { path: '/profile',  label: 'Profile',  icon: 'person' },
  ];

  return (
    <>
      {/* Top App Bar — Blinkit/Instamart style */}
      <header className="navbar">
        <div className="navbar-inner">
          {/* Left: Brand + Location Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link to="/" className="navbar-brand" style={{ flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--color-primary)' }}>shelves</span>
              <span>ShelfNest</span>
            </Link>

            {/* Divider */}
            <div style={{ width: 1, height: 24, background: 'var(--color-border)', margin: '0 0.25rem' }} />

            {/* Location Picker */}
            <LocationPicker />
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {user && (
              <button
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  background: 'none', border: '1px solid var(--color-border)',
                  color: 'var(--text-secondary)', cursor: 'pointer',
                  padding: '0.35rem 0.65rem', borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem', fontWeight: 500,
                  transition: 'all 0.15s',
                }}
                title="Sign Out"
                id="logout-btn"
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-container)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
                <span style={{ display: 'none' }} className="sm-show">Sign Out</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Navigation Bar */}
      <nav className="bottom-nav">
        {navItems.map(({ path, label, icon }) => (
          <Link
            key={path}
            to={path}
            className={`bottom-nav-item ${location.pathname === path ? 'active' : ''}`}
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
