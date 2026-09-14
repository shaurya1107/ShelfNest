import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerApi, verifyOtp as verifyOtpApi, resendOtp as resendOtpApi } from '../api';
import toast from 'react-hot-toast';

const ICON_MAP = {
  name: 'person',
  email: 'mail',
  password: 'lock',
  phone: 'phone',
  address: 'location_on',
  community_code: 'vpn_key',
};

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s\-]{10,16}$/;

export default function Register() {
  const { loginUser } = useAuth();
  const location = useLocation();

  // If navigated from login with pending verification
  const initialVerificationState = location.state?.requiresVerification || false;
  const initialEmail = location.state?.email || '';
  const initialOtpDemo = location.state?.otpDemo || '';

  const [step, setStep] = useState(initialVerificationState ? 2 : 1); // 1: Form, 2: OTP
  const [form, setForm] = useState({
    name: '',
    email: initialEmail,
    password: '',
    phone: '',
    community_code: '',
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [demoOtpCode, setDemoOtpCode] = useState(initialOtpDemo);
  const [targetEmail, setTargetEmail] = useState(initialEmail);
  const [resendTimer, setResendTimer] = useState(0);

  // Resend timer countdown
  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Password rules validation helper
  const passVal = {
    length: form.password.length >= 6,
    upper: /[A-Z]/.test(form.password),
    lower: /[a-z]/.test(form.password),
    number: /[0-9]/.test(form.password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(form.password),
  };

  const isPasswordValid = Object.values(passVal).every(Boolean);

  const updateForm = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // Step 1: Submit Form to Create Account & Generate OTP
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Client side strict checks
    if (form.name.trim().length < 2) {
      toast.error('Full name must be at least 2 characters long');
      return;
    }

    if (!EMAIL_REGEX.test(form.email.trim())) {
      toast.error('Please enter a valid email address (e.g. user@example.com)');
      return;
    }

    if (!PHONE_REGEX.test(form.phone.trim())) {
      toast.error('Phone number is mandatory and must contain a valid 10-15 digit phone number');
      return;
    }

    if (!isPasswordValid) {
      toast.error('Password does not meet all security requirements listed below.');
      return;
    }

    if (!form.community_code.trim()) {
      toast.error('Community code is required');
      return;
    }

    setLoading(true);
    try {
      const res = await registerApi(form);
      setTargetEmail(res.email || form.email.trim());
      setDemoOtpCode(res.otp_demo || '');
      setStep(2);
      setResendTimer(30);
      toast.success(res.message || 'OTP sent! Please check your email.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // OTP Input change handler
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto focus next field
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(paste)) {
      setOtp(paste.split(''));
      e.preventDefault();
    }
  };

  // Step 2: Submit 6-digit OTP Code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCodeString = otp.join('');
    if (otpCodeString.length !== 6) {
      toast.error('Please enter the complete 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtpApi(targetEmail, otpCodeString);
      loginUser(res.user, res.token);
      toast.success(res.message || 'Account verified! Welcome to ShelfNest 🎉');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const res = await resendOtpApi(targetEmail);
      setDemoOtpCode(res.otp_demo || '');
      setResendTimer(30);
      toast.success(res.message || 'New OTP sent to your email.');
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
            {step === 1 ? 'how_to_reg' : 'mark_email_read'}
          </span>
          <h1>{step === 1 ? 'Join ShelfNest' : 'Verify Your Email'}</h1>
          <p>{step === 1 ? 'Create your verified account to start sharing items' : `We've sent a 6-digit verification code to ${targetEmail}`}</p>
        </div>

        <div className="auth-card">
          {step === 1 ? (
            <form onSubmit={handleFormSubmit}>
              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="register-name">Full Name *</label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>
                    person
                  </span>
                  <input
                    id="register-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Arjun Sharma"
                    value={form.name}
                    onChange={updateForm('name')}
                    required
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="register-email">Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>
                    mail
                  </span>
                  <input
                    id="register-email"
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={updateForm('email')}
                    required
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
                {form.email && !EMAIL_REGEX.test(form.email) && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-error, #ef4444)', marginTop: '0.25rem', display: 'block' }}>
                    ⚠️ Please enter a valid email address (e.g. name@domain.com)
                  </span>
                )}
              </div>

              {/* Phone (MANDATORY) */}
              <div className="form-group">
                <label htmlFor="register-phone">Phone Number * <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>(Required — for item contact)</span></label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>
                    phone
                  </span>
                  <input
                    id="register-phone"
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9876543210"
                    value={form.phone}
                    onChange={updateForm('phone')}
                    required
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
                {form.phone && !PHONE_REGEX.test(form.phone) && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-error, #ef4444)', marginTop: '0.25rem', display: 'block' }}>
                    ⚠️ Enter a valid 10-15 digit contact number
                  </span>
                )}
              </div>


              {/* Community Code */}
              <div className="form-group">
                <label htmlFor="register-community_code">Community Code *</label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>
                    vpn_key
                  </span>
                  <input
                    id="register-community_code"
                    type="text"
                    className="form-input"
                    placeholder="e.g. SHELF2024"
                    value={form.community_code}
                    onChange={updateForm('community_code')}
                    required
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label htmlFor="register-password">Password *</label>
                <div style={{ position: 'relative' }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: 18 }}>
                    lock
                  </span>
                  <input
                    id="register-password"
                    type={showPass ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={updateForm('password')}
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

                {/* Password Strength Requirements Live Checklist */}
                {form.password.length > 0 && (
                  <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--color-surface-container)', borderRadius: 'var(--radius-md)', fontSize: '0.781rem', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>Password Requirements:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem' }}>
                      <span style={{ color: passVal.length ? 'var(--color-success, #22c55e)' : 'var(--text-tertiary)' }}>
                        {passVal.length ? '✓' : '○'} Min 6 characters
                      </span>
                      <span style={{ color: passVal.upper ? 'var(--color-success, #22c55e)' : 'var(--text-tertiary)' }}>
                        {passVal.upper ? '✓' : '○'} Uppercase (A-Z)
                      </span>
                      <span style={{ color: passVal.lower ? 'var(--color-success, #22c55e)' : 'var(--text-tertiary)' }}>
                        {passVal.lower ? '✓' : '○'} Lowercase (a-z)
                      </span>
                      <span style={{ color: passVal.number ? 'var(--color-success, #22c55e)' : 'var(--text-tertiary)' }}>
                        {passVal.number ? '✓' : '○'} Number (0-9)
                      </span>
                      <span style={{ color: passVal.special ? 'var(--color-success, #22c55e)' : 'var(--text-tertiary)', gridColumn: 'span 2' }}>
                        {passVal.special ? '✓' : '○'} Special character (!@#$%^&*...)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} id="register-submit">
                {loading ? (
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>send</span> Proceed to Verification
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: 6-DIGIT OTP VERIFICATION */
            <form onSubmit={handleVerifyOtp}>
              {/* Demo OTP Banner for local/testing */}
              {demoOtpCode && (
                <div style={{ marginBottom: '1.25rem', padding: '0.875rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px dashed #3b82f6', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3b82f6', fontWeight: 700 }}>
                    🔑 Demo Mode Verification Code
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.2em', color: 'var(--color-primary)', marginTop: '0.25rem' }}>
                    {demoOtpCode}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                    (In production, this code is delivered to {targetEmail})
                  </div>
                </div>
              )}

              <div className="form-group">
                <label style={{ textAlign: 'center', display: 'block', marginBottom: '0.75rem' }}>Enter 6-Digit OTP Code</label>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }} onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      style={{
                        width: '2.75rem',
                        height: '3.25rem',
                        textAlign: 'center',
                        fontSize: '1.35rem',
                        fontWeight: 'bold',
                        borderRadius: 'var(--radius-md)',
                        border: digit ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: 'var(--color-surface)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading || otp.join('').length !== 6} id="verify-otp-submit">
                {loading ? (
                  <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                ) : (
                  <>
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>verified</span> Verify & Complete Signup
                  </>
                )}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', fontSize: '0.8125rem' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span> Edit Info
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendTimer > 0 || loading}
                  style={{ background: 'none', border: 'none', color: resendTimer > 0 ? 'var(--text-tertiary)' : 'var(--color-primary)', cursor: resendTimer > 0 ? 'default' : 'pointer', fontWeight: 600 }}
                >
                  {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend OTP Code'}
                </button>
              </div>
            </form>
          )}

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
