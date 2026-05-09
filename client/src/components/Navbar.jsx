import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: 'home' },
    { path: '/my-items', label: 'Explore', icon: 'explore' },
    { path: '/bookings', label: 'Rentals', icon: 'handyman' },
    { path: '/profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <>
      {/* Top App Bar */}
      <header className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--color-primary)' }}>location_on</span>
            <span>ShelfNest</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
            <button
              className="material-symbols-outlined"
              style={{
                background: 'none', border: 'none', color: 'var(--text-secondary)',
                cursor: 'pointer', padding: 'var(--space-sm)', borderRadius: 'var(--radius-full)',
                fontSize: 24, transition: 'background var(--transition-fast)',
              }}
              title="Search"
            >
              search
            </button>
            {user && (
              <button
                onClick={logout}
                className="material-symbols-outlined"
                style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', padding: 'var(--space-sm)', borderRadius: 'var(--radius-full)',
                  fontSize: 24, transition: 'background var(--transition-fast)',
                }}
                title="Sign Out"
              >
                logout
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
