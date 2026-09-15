import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../api';
import toast from 'react-hot-toast';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s\-]{10,16}$/;

const PASS_RULES = [
  { key: 'length',  label: 'Min 6 characters',       test: p => p.length >= 6 },
  { key: 'upper',   label: 'Uppercase letter (A-Z)',  test: p => /[A-Z]/.test(p) },
  { key: 'lower',   label: 'Lowercase letter (a-z)',  test: p => /[a-z]/.test(p) },
  { key: 'number',  label: 'Number (0–9)',            test: p => /[0-9]/.test(p) },
  { key: 'special', label: 'Special char (!@#$...)',  test: p => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p) },
];

export default function Register() {
  const { loginUser } = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', community_code: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = field => e => setForm({ ...form, [field]: e.target.value });

  const passChecks = PASS_RULES.map(r => ({ ...r, ok: r.test(form.password) }));
  const passValid  = passChecks.every(r => r.ok);
  const emailValid = EMAIL_REGEX.test(form.email);
  const phoneValid = PHONE_REGEX.test(form.phone);

  const handleSubmit = async e => {
    e.preventDefault();

    if (form.name.trim().length < 2) {
      return toast.error('Full name must be at least 2 characters');
    }
    if (!emailValid) {
      return toast.error('Please enter a valid email address (e.g. name@example.com)');
    }
    if (!phoneValid) {
      return toast.error('Phone number must be 10–15 digits');
    }
    if (!passValid) {
      return toast.error('Password does not meet all requirements shown below');
    }
    if (!form.community_code.trim()) {
      return toast.error('Community code is required');
    }

    setLoading(true);
    try {
      const res = await registerApi(form);
      // res contains { user, token } — log in immediately
      if (res.user && res.token) {
        loginUser(res.user, res.token);
        toast.success(`Welcome to ShelfNest, ${res.user.name.split(' ')[0]}! 🎉`);
      } else {
        toast.success(res.message || 'Account created! Please log in.');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container fade-in">
        <div className="auth-header">
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
            how_to_reg
          </span>
          <h1>Join ShelfNest</h1>
          <p>Create your account and start sharing with your community</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="reg-name">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>person</span>
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Shaurya Devesh"
                  value={form.name}
                  onChange={update('name')}
                  required
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="reg-email">Email Address *</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>mail</span>
                <input
                  id="reg-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={update('email')}
                  required
                  style={{ paddingLeft: '2.75rem', borderColor: form.email && !emailValid ? '#ef4444' : undefined }}
                />
              </div>
              {form.email && !emailValid && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                  ⚠ Enter a valid email like name@domain.com
                </span>
              )}
            </div>

            {/* Phone — REQUIRED */}
            <div className="form-group">
              <label htmlFor="reg-phone">
                Phone Number *{' '}
                <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>
                  (Required — for item contact)
                </span>
              </label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>phone</span>
                <input
                  id="reg-phone"
                  type="tel"
                  className="form-input"
                  placeholder="e.g. 9876543210"
                  value={form.phone}
                  onChange={update('phone')}
                  required
                  style={{ paddingLeft: '2.75rem', borderColor: form.phone && !phoneValid ? '#ef4444' : undefined }}
                />
              </div>
              {form.phone && !phoneValid && (
                <span style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem', display: 'block' }}>
                  ⚠ Enter a valid 10–15 digit phone number
                </span>
              )}
            </div>

            {/* Community Code */}
            <div className="form-group">
              <label htmlFor="reg-code">Community Code *</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>vpn_key</span>
                <input
                  id="reg-code"
                  type="text"
                  className="form-input"
                  placeholder="e.g. SHELF2024"
                  value={form.community_code}
                  onChange={update('community_code')}
                  required
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="reg-password">Password *</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>lock</span>
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={update('password')}
                  required
                  style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{showPass ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>

              {/* Live password checklist */}
              {form.password.length > 0 && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--color-surface-container)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Password Requirements:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                    {passChecks.map(r => (
                      <span key={r.key} style={{ fontSize: '0.75rem', color: r.ok ? '#22c55e' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>{r.ok ? 'check_circle' : 'radio_button_unchecked'}</span>
                        {r.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              disabled={loading}
              id="register-submit"
            >
              {loading
                ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                : <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>how_to_reg</span> Create Account</>
              }
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
