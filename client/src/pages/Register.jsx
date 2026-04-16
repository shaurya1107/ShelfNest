import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register as registerApi } from '../api';
import toast from 'react-hot-toast';
import { UserPlus, Mail, Lock, User, Phone, MapPin, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const { loginUser } = useAuth();
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', address: '', community_code: '',
  });
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
    { key: 'name', label: 'Full Name', icon: User, type: 'text', placeholder: 'John Doe', required: true },
    { key: 'email', label: 'Email', icon: Mail, type: 'email', placeholder: 'you@example.com', required: true },
    { key: 'password', label: 'Password', icon: Lock, type: 'password', placeholder: 'Min 6 characters', required: true },
    { key: 'phone', label: 'Phone (optional)', icon: Phone, type: 'tel', placeholder: '9876543210' },
    { key: 'address', label: 'Address (optional)', icon: MapPin, type: 'text', placeholder: '12 Green Park, Sector 5' },
    { key: 'community_code', label: 'Community Code', icon: KeyRound, type: 'text', placeholder: 'e.g. SHELF2024', required: true },
  ];

  return (
    <div className="auth-wrapper">
      <div className="auth-container fade-in">
        <div className="auth-header">
          <div className="logo">📦</div>
          <h1>Join ShelfNest</h1>
          <p>Create your account and start sharing with your community</p>
        </div>

        <div className="auth-card">
          <form onSubmit={handleSubmit}>
            {fields.map(({ key, label, icon: Icon, type, placeholder, required }) => (
              <div className="form-group" key={key}>
                <label htmlFor={`register-${key}`}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <Icon size={18} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
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
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading} id="register-submit">
              {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <><UserPlus size={18} /> Create Account</>}
            </button>
          </form>

          <div style={{ margin: '1rem 0 0', padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
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
