import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../api';
import toast from 'react-hot-toast';

const ICON_MAP = { name: 'person', email: 'mail', password: 'lock', phone: 'phone', address: 'location_on', community_code: 'vpn_key' };

export default function Register() {
  const { loginUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', community_code: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user, token } = await registerApi(form);
      loginUser(user, token);
      toast.success('Account created! Welcome to ShelfNest 🎉');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', required: true },
    { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 6 characters', required: true },
    { key: 'phone', label: 'Phone (optional)', type: 'tel', placeholder: '9876543210' },
    { key: 'address', label: 'Address (optional)', type: 'text', placeholder: '12 Green Park, Sector 5' },
    { key: 'community_code', label: 'Community Code', type: 'text', placeholder: 'e.g. SHELF2024', required: true },
  ];

  return (
    <div className="auth-wrapper">
      <div className="auth-container fade-in">
        <div className="auth-header">
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>location_on</span>
          <h1>Join ShelfNest</h1>
          <p>Create your account and start sharing with your community</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            {fields.map(({ key, label, type, placeholder, required }) => (
              <div className="form-group" key={key}>
                <label htmlFor={`register-${key}`}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>{ICON_MAP[key]}</span>
                  <input
                    id={`register-${key}`}
                    type={key === 'password' ? (showPass ? 'text' : 'password') : type}
                    className="form-input"
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={update(key)}
                    required={required}
                    minLength={key === 'password' ? 6 : undefined}
                    style={{ paddingLeft: '2.75rem', paddingRight: key === 'password' ? '2.75rem' : '1rem' }}
                  />
                  {key === 'password' && (
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPass ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} id="register-submit">
              {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span> Create Account
              </>}
            </button>
          </form>

          <div style={{ margin: '1rem 0 0', padding: '0.75rem', background: 'var(--color-surface-container)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--text-secondary)', border: '1px solid var(--color-border)' }}>
            💡 Use community code <strong style={{ color: 'var(--color-primary)' }}>SHELF2024</strong> to join the demo community
          </div>
        </div>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
