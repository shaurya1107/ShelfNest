import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, uploadImage, getUserReviews } from '../api';
import StarRating from '../components/StarRating';
import toast from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Shield, Camera, Save, Star, Calendar, Package } from 'lucide-react';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({
    name: '', phone: '', address: '', bio: '', avatar_url: '',
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '', phone: user.phone || '',
        address: user.address || '', bio: user.bio || '',
        avatar_url: user.avatar_url || '',
      });
      getUserReviews(user.id).then(setReviews).catch(() => {});
    }
  }, [user]);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { url } = await uploadImage(file);
      setForm({ ...form, avatar_url: url });
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile(form);
      await refreshUser();
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const avgRating = reviews.length > 0
    ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length * 10) / 10
    : null;

  const getInitials = (name) => name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="page-container fade-in">
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        <div className="page-header">
          <h1>My Profile</h1>
        </div>

        {/* Profile Header */}
        <div className="card mb-2">
          <div className="profile-header">
            <div style={{ position: 'relative' }}>
              <div className="profile-avatar">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt={user?.name} />
                ) : (
                  getInitials(user?.name)
                )}
              </div>
              {editing && (
                <label htmlFor="avatar-upload" style={{
                  position: 'absolute', bottom: -4, right: -4, width: 28, height: 28,
                  borderRadius: '50%', background: 'var(--color-primary)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid var(--color-surface)',
                }}>
                  <Camera size={14} color="#fff" />
                  <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            <div>
              <h2 style={{ fontSize: '1.375rem', fontWeight: 700 }}>{user?.name}</h2>
              <p className="text-muted text-sm flex-gap">
                <Mail size={14} /> {user?.email}
              </p>
              <div className="flex-gap mt-1">
                <span className="badge badge-primary">
                  <Shield size={10} /> {user?.community_code}
                </span>
                <span className="badge badge-success">✓ Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          <div className="stat-card">
            <div className="stat-value">{avgRating || '—'}</div>
            <div className="stat-label">Avg Rating</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{reviews.length}</div>
            <div className="stat-label">Reviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}</div>
            <div className="stat-label">Member Since</div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="card mb-2">
          <div className="flex-between mb-2">
            <h3 style={{ fontSize: '1.125rem' }}>Personal Information</h3>
            {!editing ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Edit</button>
            ) : (
              <div className="flex-gap">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading}>
                  {loading ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <><Save size={14} /> Save</>}
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" className="form-input" value={form.name} onChange={update('name')} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" className="form-input" value={form.phone} onChange={update('phone')} placeholder="Your phone number" />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" className="form-input" value={form.address} onChange={update('address')} placeholder="Your address" />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea className="form-input" value={form.bio} onChange={update('bio')} placeholder="Tell your community about yourself..." rows={3} />
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="flex-gap text-sm">
                <User size={16} style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-muted">Name:</span>
                <span>{user?.name}</span>
              </div>
              <div className="flex-gap text-sm">
                <Phone size={16} style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-muted">Phone:</span>
                <span>{user?.phone || 'Not set'}</span>
              </div>
              <div className="flex-gap text-sm">
                <MapPin size={16} style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-muted">Address:</span>
                <span>{user?.address || 'Not set'}</span>
              </div>
              {user?.bio && (
                <div className="text-sm mt-1">
                  <span className="text-muted">Bio:</span>
                  <p style={{ marginTop: '0.25rem', lineHeight: 1.6 }}>{user.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
            <Star size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem', color: 'var(--color-accent)' }} />
            Reviews About Me
          </h3>
          {reviews.length > 0 ? (
            reviews.map(review => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="review-avatar">{review.reviewer_name?.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div className="flex-between">
                      <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{review.reviewer_name}</span>
                      <span className="text-xs text-muted">{review.item_title}</span>
                    </div>
                    <StarRating rating={review.rating} size={14} />
                  </div>
                </div>
                {review.comment && <p className="review-content">{review.comment}</p>}
              </div>
            ))
          ) : (
            <p className="text-muted text-sm">No reviews yet. Start lending to build your reputation!</p>
          )}
        </div>
      </div>
    </div>
  );
}
