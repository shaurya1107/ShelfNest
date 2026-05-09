import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi } from '../api';
import toast from 'react-hot-toast';

export default function Login() {
  const { loginUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user, token } = await loginApi(email, password);
      loginUser(user, token);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
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
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>location_on</span>
          <h1>Welcome Back</h1>
          <p>Sign in to your ShelfNest account</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>mail</span>
                <input
                  id="login-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '2.75rem' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>lock</span>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} id="login-submit">
              {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span> Sign In
              </>}
            </button>
          </form>

          <div style={{ margin: '1.25rem 0', padding: '1rem', background: 'var(--color-surface-container)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', border: '1px solid var(--color-border)' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Demo Account:</div>
            <div style={{ color: 'var(--text-secondary)' }}>📧 arjun@example.com</div>
            <div style={{ color: 'var(--text-secondary)' }}>🔑 password123</div>
          </div>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
}
