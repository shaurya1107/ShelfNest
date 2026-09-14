import { useState, useEffect, useRef, useCallback } from 'react';

const LOCATION_KEY = 'shelfnest_location';

function saveLocation(loc) {
  try { localStorage.setItem(LOCATION_KEY, JSON.stringify(loc)); } catch {}
}

function loadLocation() {
  try { return JSON.parse(localStorage.getItem(LOCATION_KEY)); } catch { return null; }
}

// Reverse geocode using OpenStreetMap Nominatim (free, no API key)
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'ShelfNest-App' } }
    );
    const data = await res.json();
    const addr = data.address || {};
    const short = [
      addr.road || addr.neighbourhood || addr.suburb,
      addr.city || addr.town || addr.village || addr.county,
      addr.state,
    ].filter(Boolean).join(', ');
    return {
      short: short || data.display_name?.split(',').slice(0, 2).join(',') || 'Your Location',
      full: data.display_name || '',
      lat,
      lng,
    };
  } catch {
    return { short: `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`, full: '', lat, lng };
  }
}

// Search places using Nominatim
async function searchPlaces(query) {
  if (!query || query.length < 3) return [];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en', 'User-Agent': 'ShelfNest-App' } }
    );
    return await res.json();
  } catch {
    return [];
  }
}

export default function LocationPicker({ onLocationChange }) {
  const [location, setLocation] = useState(loadLocation());
  const [open, setOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef(null);
  const searchTimer = useRef(null);

  useEffect(() => {
    if (location) onLocationChange?.(location);
    // Auto-detect on first load if no saved location
    else handleDetect();
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (!searchQuery || searchQuery.length < 3) { setSearchResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const results = await searchPlaces(searchQuery);
      setSearchResults(results);
      setSearching(false);
    }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  const handleDetect = async () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setLocation(loc);
        saveLocation(loc);
        onLocationChange?.(loc);
        setDetecting(false);
        setOpen(false);
      },
      () => { setDetecting(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSelectResult = async (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const addr = result.address || {};
    const short = [
      addr.road || addr.neighbourhood || addr.suburb,
      addr.city || addr.town || addr.village || addr.county,
      addr.state,
    ].filter(Boolean).join(', ') || result.display_name?.split(',').slice(0, 2).join(',');
    const loc = { short, full: result.display_name, lat, lng };
    setLocation(loc);
    saveLocation(loc);
    onLocationChange?.(loc);
    setOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const locShort = location?.short || 'Set your location';
  const locCity = locShort.split(',')[0] || locShort;

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Trigger Button – Blinkit-style */}
      <button
        id="location-picker-btn"
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-md)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container)'}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 20, color: 'var(--color-primary)', fontVariationSettings: "'FILL' 1" }}
        >
          location_on
        </span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', lineHeight: 1 }}>
            Deliver to
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.2rem',
            fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)',
            lineHeight: 1.3, maxWidth: '150px', overflow: 'hidden',
            whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          }}>
            {detecting ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>Detecting…</span>
            ) : locCity}
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>expand_more</span>
          </div>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
          width: 340, zIndex: 999,
          overflow: 'hidden',
          animation: 'fadeSlideDown 0.18s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1rem 0.5rem',
            borderBottom: '1px solid var(--color-border)',
            background: 'var(--color-surface-container-low)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Your Location</span>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
              </button>
            </div>

            {/* Current location */}
            {location && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                padding: '0.5rem 0.75rem', marginBottom: '0.5rem',
                background: 'rgba(var(--color-primary-rgb, 100,160,255),0.08)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(var(--color-primary-rgb, 100,160,255),0.2)',
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)', marginTop: 1, fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>{locCity}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem', lineHeight: 1.4 }}>
                    {location.short}
                  </div>
                </div>
              </div>
            )}

            {/* Use my live location */}
            <button
              onClick={handleDetect}
              disabled={detecting}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.625rem 0.75rem',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)', cursor: detecting ? 'wait' : 'pointer',
                color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.8125rem',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => !detecting && (e.currentTarget.style.background = 'var(--color-surface-container)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-surface)')}
            >
              {detecting ? (
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: 18, fontVariationSettings: "'FILL' 1" }}>my_location</span>
              )}
              {detecting ? 'Detecting your location…' : 'Use my current location'}
            </button>
          </div>

          {/* Search */}
          <div style={{ padding: '0.75rem 1rem' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{
                position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                fontSize: 16, color: 'var(--text-tertiary)',
              }}>search</span>
              <input
                type="text"
                className="form-input"
                placeholder="Search for area, street, city…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.25rem', fontSize: '0.875rem', height: '2.25rem' }}
                autoFocus
                id="location-search"
              />
            </div>

            {/* Search Results */}
            {searching && (
              <div style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
                <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, margin: '0 auto 0.35rem' }} />
                Searching…
              </div>
            )}
            {!searching && searchResults.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                {searchResults.map((r, i) => {
                  const addr = r.address || {};
                  const label = [addr.road || addr.neighbourhood, addr.city || addr.town || addr.county, addr.state].filter(Boolean).join(', ') || r.display_name?.split(',').slice(0, 3).join(',');
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelectResult(r)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                        padding: '0.5rem 0.5rem', background: 'none', border: 'none',
                        borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                        textAlign: 'left', transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-container)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-tertiary)', marginTop: 2, flexShrink: 0 }}>place</span>
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>{label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>
                          {r.display_name?.split(',').slice(0, 4).join(',')}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {!searching && searchQuery.length >= 3 && searchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
