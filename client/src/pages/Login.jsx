import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as loginApi, forgotPassword, resetPassword } from '../api';
import toast from 'react-hot-toast';

// Password strength validation (mirrors backend rules)
const PASSWORD_REGEX = {
  length:  (p) => p.length >= 6,
  upper:   (p) => /[A-Z]/.test(p),
  lower:   (p) => /[a-z]/.test(p),
  number:  (p) => /[0-9]/.test(p),
  special: (p) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p),
};

export default function Login() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password flow state
  const [forgotStep, setForgotStep] = useState(null); // null | 'email' | 'otp' | 'newpass'
  const [fpEmail, setFpEmail] = useState('');
  const [fpOtp, setFpOtp] = useState('');
  const [fpNewPass, setFpNewPass] = useState('');
  const [fpShowPass, setFpShowPass] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpDemoOtp, setFpDemoOtp] = useState('');

  /* ── Login ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user, token } = await loginApi(email, password);
      loginUser(user, token);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
    } catch (err) {
      if (err.data && err.data.requires_verification) {
        toast.error('Account requires email verification. Redirecting…');
        navigate('/register', {
          state: { requiresVerification: true, email: err.data.email, otpDemo: err.data.otp_demo },
        });
      } else {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── Forgot Password – Step 1: send OTP ── */
  const handleFpSendOtp = async (e) => {
    e.preventDefault();
    if (!fpEmail.trim()) { toast.error('Please enter your email address'); return; }
    setFpLoading(true);
    try {
      const res = await forgotPassword(fpEmail.trim());
      setFpDemoOtp(res.otp_demo || '');
      setForgotStep('otp');
      toast.success('OTP sent to your registered email!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setFpLoading(false);
    }
  };

  /* ── Forgot Password – Step 2: verify OTP ── */
  const handleFpVerifyOtp = (e) => {
    e.preventDefault();
    if (!fpOtp.trim() || fpOtp.trim().length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setForgotStep('newpass');
  };

  /* ── Forgot Password – Step 3: set new password ── */
  const handleFpReset = async (e) => {
    e.preventDefault();
    const failedRules = Object.entries(PASSWORD_REGEX).filter(([, fn]) => !fn(fpNewPass));
    if (failedRules.length > 0) {
      toast.error('Password does not meet requirements');
      return;
    }
    setFpLoading(true);
    try {
      await resetPassword(fpEmail.trim(), fpOtp.trim(), fpNewPass);
      toast.success('Password reset successful! Please log in.');
      setForgotStep(null);
      setFpEmail(''); setFpOtp(''); setFpNewPass(''); setFpDemoOtp('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setFpLoading(false);
    }
  };

  const closeForgot = () => {
    setForgotStep(null);
    setFpEmail(''); setFpOtp(''); setFpNewPass(''); setFpDemoOtp('');
  };

  /* ── Render ── */
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label htmlFor="login-password" style={{ marginBottom: 0 }}>Password</label>
                <button
                  type="button"
                  onClick={() => setForgotStep('email')}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8125rem', cursor: 'pointer', padding: 0 }}
                >
                  Forgot Password?
                </button>
              </div>
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
              {loading
                ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                : <><span className="material-symbols-outlined" style={{ fontSize: 18 }}>login</span> Sign In</>
              }
            </button>
          </form>

          <div style={{ margin: '1.25rem 0', padding: '1rem', background: 'var(--color-surface-container)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', border: '1px solid var(--color-border)' }}>
            <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: 500 }}>Demo Account:</div>
            <div style={{ color: 'var(--text-secondary)' }}>📧 arjun@example.com</div>
            <div style={{ color: 'var(--text-secondary)' }}>🔑 Password@123</div>
          </div>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>

      {/* ── Forgot Password Modal ── */}
      {forgotStep && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
            padding: '2rem', width: '100%', maxWidth: '420px',
            border: '1px solid var(--color-border)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}>
            {/* Step 1: Enter email */}
            {forgotStep === 'email' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Reset Password</h2>
                  <button type="button" onClick={closeForgot} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <p className="text-sm text-muted mb-2">Enter your registered email address and we'll send you a 6-digit OTP to reset your password.</p>
                <form onSubmit={handleFpSendOtp}>
                  <div className="form-group">
                    <label htmlFor="fp-email">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>mail</span>
                      <input
                        id="fp-email"
                        type="email"
                        className="form-input"
                        placeholder="you@example.com"
                        value={fpEmail}
                        onChange={(e) => setFpEmail(e.target.value)}
                        required
                        style={{ paddingLeft: '2.75rem' }}
                        autoFocus
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full" disabled={fpLoading}>
                    {fpLoading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Send OTP'}
                  </button>
                </form>
              </>
            )}

            {/* Step 2: Enter OTP */}
            {forgotStep === 'otp' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Enter OTP</h2>
                  <button type="button" onClick={closeForgot} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <p className="text-sm text-muted mb-2">
                  A 6-digit OTP was sent to <strong>{fpEmail}</strong>.
                </p>
                {fpDemoOtp && (
                  <div style={{ padding: '0.5rem 0.75rem', marginBottom: '1rem', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem' }}>
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>Demo OTP: {fpDemoOtp}</span>
                  </div>
                )}
                <form onSubmit={handleFpVerifyOtp}>
                  <div className="form-group">
                    <label htmlFor="fp-otp">6-Digit OTP</label>
                    <input
                      id="fp-otp"
                      type="text"
                      className="form-input"
                      placeholder="123456"
                      value={fpOtp}
                      onChange={(e) => setFpOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      maxLength={6}
                      autoFocus
                      style={{ letterSpacing: '0.25em', fontSize: '1.25rem', textAlign: 'center' }}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-full">Verify OTP</button>
                </form>
              </>
            )}

            {/* Step 3: New password */}
            {forgotStep === 'newpass' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>New Password</h2>
                  <button type="button" onClick={closeForgot} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <form onSubmit={handleFpReset}>
                  <div className="form-group">
                    <label htmlFor="fp-newpass">New Password</label>
                    <div style={{ position: 'relative' }}>
                      <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>lock</span>
                      <input
                        id="fp-newpass"
                        type={fpShowPass ? 'text' : 'password'}
                        className="form-input"
                        placeholder="New password"
                        value={fpNewPass}
                        onChange={(e) => setFpNewPass(e.target.value)}
                        required
                        style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setFpShowPass(!fpShowPass)}
                        style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{fpShowPass ? 'visibility_off' : 'visibility'}</span>
                      </button>
                    </div>
                  </div>
                  {/* Password strength checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '1rem', fontSize: '0.78rem' }}>
                    {[
                      ['length',  '6+ characters'],
                      ['upper',   'Uppercase letter (A-Z)'],
                      ['lower',   'Lowercase letter (a-z)'],
                      ['number',  'Number (0-9)'],
                      ['special', 'Special character (!@#$...)'],
                    ].map(([key, label]) => {
                      const ok = PASSWORD_REGEX[key](fpNewPass);
                      return (
                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: ok ? '#6ee7b7' : 'var(--text-tertiary)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{ok ? 'check_circle' : 'radio_button_unchecked'}</span>
                          {label}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-full"
                    disabled={fpLoading || Object.values(PASSWORD_REGEX).some((fn) => !fn(fpNewPass))}
                  >
                    {fpLoading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Reset Password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
