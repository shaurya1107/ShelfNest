import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getBookings, approveBooking, rejectBooking,
  activateBooking, completeBooking, cancelBooking, uploadImage
} from '../api';
import toast from 'react-hot-toast';
import { format, differenceInDays } from 'date-fns';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',   icon: 'schedule' },
  approved:  { label: 'Approved',  color: '#6ee7b7', bg: 'rgba(110,231,183,0.12)',  icon: 'check_circle' },
  active:    { label: 'ACTIVE',    color: '#bac7df', bg: 'rgba(186,199,223,0.12)',  icon: 'play_circle' },
  completed: { label: 'Completed', color: '#93c5fd', bg: 'rgba(147,197,253,0.12)',  icon: 'task_alt' },
  rejected:  { label: 'Rejected',  color: '#ffb4ab', bg: 'rgba(255,180,171,0.12)', icon: 'cancel' },
  cancelled: { label: 'Cancelled', color: '#8f9097', bg: 'rgba(143,144,151,0.12)', icon: 'block' },
};

function calcDays(start, end) {
  const d = differenceInDays(new Date(end), new Date(start));
  return d > 0 ? d : 1;
}

export default function MyBookings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('borrower');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBookings(tab);
      setBookings(data);
    } catch (err) {
      console.error('Fetch bookings error:', err);
      toast.error(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleAction = async (action, id, extraData) => {
    setActionLoading(id);
    try {
      switch (action) {
        case 'approve':  await approveBooking(id);           toast.success('Request accepted!'); break;
        case 'reject':   await rejectBooking(id);            toast.success('Request rejected'); break;
        case 'activate': await activateBooking(id, extraData); toast.success('Pickup photo saved & rental activated!'); break;
        case 'complete': await completeBooking(id, extraData); toast.success('Return photo saved & rental completed!'); break;
        case 'cancel':   await cancelBooking(id);            toast.success('Booking cancelled'); break;
      }
      fetchBookings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleImageAction = async (action, bookingId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        setActionLoading(bookingId);
        const { url } = await uploadImage(file);
        await handleAction(action, bookingId, url);
      } catch (err) {
        toast.error(err.message);
        setActionLoading(null);
      }
    };
    input.click();
  };

  /* ─── Card: BORROWER view ─── */
  const BorrowerCard = ({ booking }) => {
    const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
    const isLoading = actionLoading === booking.id;
    const ownerName = booking.owner_name || 'Community Member';
    const days = calcDays(booking.start_date, booking.end_date);
    const pricePerDay = booking.price_per_day || 0;
    const totalCost = days * pricePerDay;

    return (
      <div className="booking-card" id={`booking-borrow-${booking.id}`}>
        {/* Header */}
        <div className="booking-card-header">
          <div className="booking-card-item">
            <div
              className="booking-card-thumb"
              onClick={() => navigate(`/items/${booking.item_id}`)}
              style={{ cursor: 'pointer' }}
            >
              {booking.item_image ? (
                <img src={booking.item_image} alt={booking.item_title} />
              ) : (
                <div className="flex-center" style={{ height: '100%', background: 'var(--color-surface-container)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-tertiary)' }}>inventory_2</span>
                </div>
              )}
            </div>
            <div>
              <h3
                style={{ fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => navigate(`/items/${booking.item_id}`)}
              >
                {booking.item_title}
              </h3>
              <div className="text-sm text-muted mt-1" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span>
                Owner: <strong style={{ color: 'var(--text-primary)' }}>{ownerName}</strong>
              </div>
            </div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            borderRadius: 'var(--radius-full)', background: status.bg, color: status.color,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{status.icon}</span>
            {status.label}
          </div>
        </div>

        {/* Dates */}
        <div className="booking-card-dates" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_month</span>
          <span>{format(new Date(booking.start_date), 'MMM d, yyyy')}</span>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
          <span>{format(new Date(booking.end_date), 'MMM d, yyyy')}</span>
          <span className="text-xs text-muted" style={{ marginLeft: '0.25rem' }}>({days} day{days !== 1 ? 's' : ''})</span>
        </div>

        {/* Cost */}
        {pricePerDay > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 0.75rem', marginBottom: '0.75rem',
            background: 'rgba(var(--color-primary-rgb, 100,160,255),0.07)',
            borderRadius: 'var(--radius-md)', fontSize: '0.875rem',
            border: '1px solid rgba(var(--color-primary-rgb, 100,160,255),0.2)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-primary)' }}>payments</span>
            <span className="text-muted">₹{pricePerDay}/day × {days} days =</span>
            <strong style={{ color: 'var(--color-primary)', fontSize: '1rem' }}>₹{totalCost}</strong>
          </div>
        )}

        {booking.notes && (
          <p className="text-sm text-muted mb-2" style={{ paddingLeft: '0.5rem', borderLeft: '2px solid var(--color-border)' }}>
            {booking.notes}
          </p>
        )}

        {/* Pickup photo (read-only for borrower) */}
        {booking.pickup_image_url && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div className="text-xs text-muted mb-1" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>photo_camera</span>
              Pickup Condition (photo by owner)
            </div>
            <img
              src={booking.pickup_image_url}
              alt="Pickup Condition"
              style={{ width: 160, height: 105, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
            />
          </div>
        )}

        {/* Return photo (read-only once uploaded) */}
        {booking.return_image_url && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div className="text-xs text-muted mb-1" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>photo_camera</span>
              Return Condition
            </div>
            <img
              src={booking.return_image_url}
              alt="Return Condition"
              style={{ width: 160, height: 105, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
            />
          </div>
        )}

        {/* Actions for borrower */}
        <div className="booking-card-actions" style={{ marginTop: '0.75rem' }}>
          {/* ACTIVE → borrower uploads return photo and completes */}
          {booking.status === 'active' && !booking.return_image_url && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleImageAction('complete', booking.id)}
              disabled={isLoading}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>photo_camera</span>
              Upload Return Photo & Complete
            </button>
          )}

          {/* pending / approved → can cancel */}
          {['pending', 'approved'].includes(booking.status) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleAction('cancel', booking.id)}
              disabled={isLoading}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
              Cancel
            </button>
          )}

          {/* completed → leave review */}
          {booking.status === 'completed' && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate(`/items/${booking.item_id}`)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>star</span>
              Leave a Review
            </button>
          )}

          {isLoading && <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />}
        </div>
      </div>
    );
  };

  /* ─── Card: OWNER / Incoming Requests view ─── */
  const OwnerCard = ({ booking }) => {
    const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
    const isLoading = actionLoading === booking.id;
    const borrowerName = booking.borrower_name || 'Community Member';
    const days = calcDays(booking.start_date, booking.end_date);
    const pricePerDay = booking.price_per_day || 0;
    const totalCost = days * pricePerDay;

    return (
      <div className="booking-card" id={`booking-owner-${booking.id}`}>
        {/* Header */}
        <div className="booking-card-header">
          <div className="booking-card-item">
            <div
              className="booking-card-thumb"
              onClick={() => navigate(`/items/${booking.item_id}`)}
              style={{ cursor: 'pointer' }}
            >
              {booking.item_image ? (
                <img src={booking.item_image} alt={booking.item_title} />
              ) : (
                <div className="flex-center" style={{ height: '100%', background: 'var(--color-surface-container)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-tertiary)' }}>inventory_2</span>
                </div>
              )}
            </div>
            <div>
              <h3
                style={{ fontSize: '1.05rem', fontWeight: 600, cursor: 'pointer' }}
                onClick={() => navigate(`/items/${booking.item_id}`)}
              >
                {booking.item_title}
              </h3>
              <div className="text-sm text-muted mt-1" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span>
                Borrower: <strong style={{ color: 'var(--text-primary)' }}>{borrowerName}</strong>
              </div>
              {booking.borrower_email && (
                <div className="text-xs text-muted" style={{ marginTop: '0.15rem' }}>
                  {booking.borrower_email}
                </div>
              )}
            </div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.375rem',
            padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            borderRadius: 'var(--radius-full)', background: status.bg, color: status.color,
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{status.icon}</span>
            {status.label}
          </div>
        </div>

        {/* Dates */}
        <div className="booking-card-dates" style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_month</span>
          <span>{format(new Date(booking.start_date), 'MMM d, yyyy')}</span>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
          <span>{format(new Date(booking.end_date), 'MMM d, yyyy')}</span>
          <span className="text-xs text-muted" style={{ marginLeft: '0.25rem' }}>({days} day{days !== 1 ? 's' : ''})</span>
        </div>

        {/* Earnings for owner */}
        {pricePerDay > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 0.75rem', marginBottom: '0.75rem',
            background: 'rgba(110,231,183,0.07)',
            borderRadius: 'var(--radius-md)', fontSize: '0.875rem',
            border: '1px solid rgba(110,231,183,0.25)',
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#6ee7b7' }}>payments</span>
            <span className="text-muted">Earnings: ₹{pricePerDay}/day × {days} days =</span>
            <strong style={{ color: '#6ee7b7', fontSize: '1rem' }}>₹{totalCost}</strong>
          </div>
        )}

        {booking.notes && (
          <p className="text-sm text-muted mb-2" style={{ paddingLeft: '0.5rem', borderLeft: '2px solid var(--color-border)' }}>
            {booking.notes}
          </p>
        )}

        {/* Pickup photo (owner uploaded this) */}
        {booking.pickup_image_url && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div className="text-xs text-muted mb-1" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>photo_camera</span>
              Pickup Condition (uploaded by you)
            </div>
            <img
              src={booking.pickup_image_url}
              alt="Pickup Condition"
              style={{ width: 160, height: 105, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
            />
          </div>
        )}

        {/* Return photo (borrower uploaded) */}
        {booking.return_image_url && (
          <div style={{ marginBottom: '0.75rem' }}>
            <div className="text-xs text-muted mb-1" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>photo_camera</span>
              Return Condition (uploaded by borrower)
            </div>
            <img
              src={booking.return_image_url}
              alt="Return Condition"
              style={{ width: 160, height: 105, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}
            />
          </div>
        )}

        {/* Actions for owner */}
        <div className="booking-card-actions" style={{ marginTop: '0.75rem' }}>
          {/* pending → accept or reject */}
          {booking.status === 'pending' && (
            <>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleAction('approve', booking.id)}
                disabled={isLoading}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
                Accept
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleAction('reject', booking.id)}
                disabled={isLoading}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                Reject
              </button>
            </>
          )}

          {/* approved → owner uploads pickup photo to activate */}
          {booking.status === 'approved' && !booking.pickup_image_url && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => handleImageAction('activate', booking.id)}
              disabled={isLoading}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>photo_camera</span>
              Upload Pickup Photo
            </button>
          )}

          {/* active with no return yet: waiting for borrower note */}
          {booking.status === 'active' && !booking.return_image_url && (
            <div className="text-xs text-muted" style={{
              padding: '0.4rem 0.75rem',
              background: 'var(--color-surface-container)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex', alignItems: 'center', gap: '0.35rem'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>hourglass_empty</span>
              Waiting for borrower to return & upload photo
            </div>
          )}

          {isLoading && <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />}
        </div>
      </div>
    );
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1>My Rentals</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track your borrows and manage incoming requests</p>
        </div>
        {user && (
          <div style={{
            background: 'var(--color-surface-container)', padding: '0.35rem 0.75rem',
            borderRadius: 'var(--radius-full)', fontSize: '0.781rem', color: 'var(--text-secondary)',
            border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '0.35rem'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--color-primary)' }}>account_circle</span>
            Logged in as: <strong style={{ color: 'var(--text-primary)' }}>{user.name}</strong>
          </div>
        )}
      </div>

      <div className="tabs">
        {[
          { key: 'borrower', label: 'My Borrows',        icon: 'shopping_bag' },
          { key: 'owner',    label: 'Incoming Requests', icon: 'inbox' },
        ].map((t) => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner spinner-lg" />
          <span>Loading...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--text-tertiary)' }}>
            {tab === 'borrower' ? 'shopping_bag' : 'inbox'}
          </span>
          <h3>{tab === 'borrower' ? 'No borrows yet' : 'No incoming requests'}</h3>
          <p>{tab === 'borrower'
            ? 'Browse items in your community and make your first booking!'
            : 'When community members request to borrow your items, requests will appear here.'
          }</p>
          {tab === 'borrower' && (
            <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Items</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tab === 'borrower'
            ? bookings.map((booking) => <BorrowerCard key={booking.id} booking={booking} />)
            : bookings.map((booking) => <OwnerCard key={booking.id} booking={booking} />)
          }
        </div>
      )}
    </div>
  );
}
