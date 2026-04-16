import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookings, approveBooking, rejectBooking, activateBooking, completeBooking, cancelBooking, uploadImage } from '../api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Calendar, Package, Check, X, Play, CheckCircle, Upload, ArrowRight, Clock, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  pending: { label: 'Pending', class: 'status-pending', icon: Clock },
  approved: { label: 'Approved', class: 'status-approved', icon: Check },
  active: { label: 'Active', class: 'status-active', icon: Play },
  completed: { label: 'Completed', class: 'status-completed', icon: CheckCircle },
  rejected: { label: 'Rejected', class: 'status-rejected', icon: X },
  cancelled: { label: 'Cancelled', class: 'status-cancelled', icon: AlertCircle },
};

export default function MyBookings() {
  const navigate = useNavigate();
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
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
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

  const tabs = [
    { key: 'borrower', label: 'My Borrows' },
    { key: 'owner', label: 'Incoming Requests' },
  ];

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>Track your borrows and manage incoming requests</p>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
          >
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
          <div className="empty-icon"><Calendar size={64} strokeWidth={1} /></div>
          <h3>No bookings yet</h3>
          <p>{tab === 'borrower' ? 'Browse items and make your first booking!' : 'Requests for your items will appear here.'}</p>
          {tab === 'borrower' && (
            <button className="btn btn-primary" onClick={() => navigate('/')}>
              Browse Items
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {bookings.map(booking => {
            const status = STATUS_CONFIG[booking.status];
            const StatusIcon = status.icon;
            const isLoading = actionLoading === booking.id;

            return (
              <div key={booking.id} className="booking-card" id={`booking-${booking.id}`}>
                <div className="booking-card-header">
                  <div className="booking-card-item">
                    <div className="booking-card-thumb" onClick={() => navigate(`/items/${booking.item_id}`)} style={{ cursor: 'pointer' }}>
                      {booking.item_image ? (
                        <img src={booking.item_image} alt={booking.item_title} />
                      ) : (
                        <div className="flex-center" style={{ height: '100%', background: 'var(--color-bg-secondary)' }}>
                          <Package size={20} strokeWidth={1} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate(`/items/${booking.item_id}`)}>
                        {booking.item_title}
                      </h3>
                      <div className="text-sm text-muted mt-1">
                        {tab === 'borrower' ? (
                          <span>Owner: {booking.owner_name}</span>
                        ) : (
                          <span>Borrower: {booking.borrower_name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`status-badge ${status.class}`}>
                    <StatusIcon size={12} /> {status.label}
                  </div>
                </div>

                <div className="booking-card-dates">
                  <Calendar size={14} />
                  <span>{format(new Date(booking.start_date), 'MMM d, yyyy')}</span>
                  <ArrowRight size={14} />
                  <span>{format(new Date(booking.end_date), 'MMM d, yyyy')}</span>
                </div>

                {booking.notes && (
                  <p className="text-sm text-muted mb-2" style={{ paddingLeft: '0.5rem', borderLeft: '2px solid var(--color-border)' }}>
                    {booking.notes}
                  </p>
                )}

                {/* Condition images */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: booking.pickup_image_url || booking.return_image_url ? '0.75rem' : 0 }}>
                  {booking.pickup_image_url && (
                    <div>
                      <div className="text-xs text-muted mb-1">Pickup condition</div>
                      <img src={booking.pickup_image_url} alt="Pickup" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
                    </div>
                  )}
                  {booking.return_image_url && (
                    <div>
                      <div className="text-xs text-muted mb-1">Return condition</div>
                      <img src={booking.return_image_url} alt="Return" style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }} />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="booking-card-actions">
                  {tab === 'owner' && booking.status === 'pending' && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAction('approve', booking.id)} disabled={isLoading}>
                        <Check size={14} /> Approve
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleAction('reject', booking.id)} disabled={isLoading}>
                        <X size={14} /> Reject
                      </button>
                    </>
                  )}

                  {tab === 'owner' && booking.status === 'approved' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleImageAction('activate', booking.id)} disabled={isLoading}>
                      <Upload size={14} /> Upload Pickup Photo & Activate
                    </button>
                  )}

                  {tab === 'owner' && booking.status === 'active' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleImageAction('complete', booking.id)} disabled={isLoading}>
                      <Upload size={14} /> Upload Return Photo & Complete
                    </button>
                  )}

                  {tab === 'borrower' && ['pending', 'approved'].includes(booking.status) && (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleAction('cancel', booking.id)} disabled={isLoading}>
                      <X size={14} /> Cancel
                    </button>
                  )}

                  {booking.status === 'completed' && tab === 'borrower' && (
                    <button className="btn btn-outline btn-sm" onClick={() => navigate(`/items/${booking.item_id}`)}>
                      Leave a Review
                    </button>
                  )}

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
