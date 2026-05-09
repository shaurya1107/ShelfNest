import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookings, approveBooking, rejectBooking, activateBooking, completeBooking, cancelBooking, uploadImage } from '../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: 'schedule' },
  approved: { label: 'Approved', color: '#6ee7b7', bg: 'rgba(110,231,183,0.12)', icon: 'check_circle' },
  active: { label: 'Active', color: '#bac7df', bg: 'rgba(186,199,223,0.12)', icon: 'play_circle' },
  completed: { label: 'Completed', color: '#93c5fd', bg: 'rgba(147,197,253,0.12)', icon: 'task_alt' },
  rejected: { label: 'Rejected', color: '#ffb4ab', bg: 'rgba(255,180,171,0.12)', icon: 'cancel' },
  cancelled: { label: 'Cancelled', color: '#8f9097', bg: 'rgba(143,144,151,0.12)', icon: 'block' },
};

export default function MyBookings() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('borrower');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchBookings = useCallback(async () => {
    try { setLoading(true); const data = await getBookings(tab); setBookings(data); }
    catch (err) { toast.error('Failed to load bookings'); } finally { setLoading(false); }
  }, [tab]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleAction = async (action, id, extraData) => {
    setActionLoading(id);
    try {
      switch (action) {
        case 'approve': await approveBooking(id); toast.success('Booking approved!'); break;
        case 'reject': await rejectBooking(id); toast.success('Booking rejected'); break;
        case 'activate': await activateBooking(id, extraData); toast.success('Item marked as picked up'); break;
        case 'complete': await completeBooking(id, extraData); toast.success('Item return confirmed!'); break;
        case 'cancel': await cancelBooking(id); toast.success('Booking cancelled'); break;
      }
      fetchBookings();
    } catch (err) { toast.error(err.message); } finally { setActionLoading(null); }
  };

  const handleImageAction = async (action, bookingId) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try { setActionLoading(bookingId); const { url } = await uploadImage(file); await handleAction(action, bookingId, url); }
      catch (err) { toast.error(err.message); setActionLoading(null); }
    };
    input.click();
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>My Rentals</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track your borrows and manage incoming requests</p>
      </div>

      <div className="tabs">
        {[{ key: 'borrower', label: 'My Borrows' }, { key: 'owner', label: 'Incoming Requests' }].map(t => (
          <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner spinner-lg" /><span>Loading...</span></div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--text-tertiary)' }}>calendar_month</span>
          <h3>No bookings yet</h3>
          <p>{tab === 'borrower' ? 'Browse items and make your first booking!' : 'Requests for your items will appear here.'}</p>
          {tab === 'borrower' && <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Items</button>}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map(booking => {
            const status = STATUS_CONFIG[booking.status];
            const isLoading = actionLoading === booking.id;
            return (
              <div key={booking.id} className="booking-card" id={`booking-${booking.id}`}>
                <div className="booking-card-header">
                  <div className="booking-card-item">
                    <div className="booking-card-thumb" onClick={() => navigate(`/items/${booking.item_id}`)} style={{ cursor: 'pointer' }}>
                      {booking.item_image ? <img src={booking.item_image} alt={booking.item_title} /> : (
                        <div className="flex-center" style={{ height: '100%', background: 'var(--color-surface-container)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--text-tertiary)' }}>inventory_2</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/items/${booking.item_id}`)}>{booking.item_title}</h3>
                      <div className="text-sm text-muted mt-1">{tab === 'borrower' ? `Owner: ${booking.owner_name}` : `Borrower: ${booking.borrower_name}`}</div>
                    </div>
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: 'var(--radius-full)', background: status.bg, color: status.color }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>{status.icon}</span> {status.label}
                  </div>
                </div>

                <div className="booking-card-dates">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>calendar_month</span>
                  <span>{format(new Date(booking.start_date), 'MMM d, yyyy')}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
                  <span>{format(new Date(booking.end_date), 'MMM d, yyyy')}</span>
                </div>

                {booking.notes && <p className="text-sm text-muted mb-2" style={{ paddingLeft: '0.5rem', borderLeft: '2px solid var(--color-border)' }}>{booking.notes}</p>}

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: booking.pickup_image_url || booking.return_image_url ? '0.75rem' : 0 }}>
                  {booking.pickup_image_url && <div><div className="text-xs text-muted mb-1">Pickup condition</div><img src={booking.pickup_image_url} alt="Pickup" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} /></div>}
                  {booking.return_image_url && <div><div className="text-xs text-muted mb-1">Return condition</div><img src={booking.return_image_url} alt="Return" style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} /></div>}
                </div>

                <div className="booking-card-actions">
                  {tab === 'owner' && booking.status === 'pending' && <>
                    <button className="btn btn-primary btn-sm" onClick={() => handleAction('approve', booking.id)} disabled={isLoading}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span> Approve</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleAction('reject', booking.id)} disabled={isLoading}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span> Reject</button>
                  </>}
                  {tab === 'owner' && booking.status === 'approved' && <button className="btn btn-primary btn-sm" onClick={() => handleImageAction('activate', booking.id)} disabled={isLoading}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>photo_camera</span> Upload Pickup Photo & Activate</button>}
                  {tab === 'owner' && booking.status === 'active' && <button className="btn btn-primary btn-sm" onClick={() => handleImageAction('complete', booking.id)} disabled={isLoading}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>photo_camera</span> Upload Return Photo & Complete</button>}
                  {tab === 'borrower' && ['pending', 'approved'].includes(booking.status) && <button className="btn btn-secondary btn-sm" onClick={() => handleAction('cancel', booking.id)} disabled={isLoading}><span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span> Cancel</button>}
                  {booking.status === 'completed' && tab === 'borrower' && <button className="btn btn-outline btn-sm" onClick={() => navigate(`/items/${booking.item_id}`)}>Leave a Review</button>}
                  {isLoading && <div className="spinner" />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
