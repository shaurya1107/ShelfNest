import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItem, createBooking, createReview } from '../api';
import { useAuth } from '../context/AuthContext';
import BookingCalendar from '../components/BookingCalendar';
import StarRating from '../components/StarRating';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ArrowLeft, Package, User, Calendar, Star, Shield, Send, MapPin } from 'lucide-react';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [bookingNotes, setBookingNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchItem = async () => {
    try {
      setLoading(true);
      const data = await getItem(id);
      setItem(data);
    } catch (err) {
      toast.error('Item not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItem(); }, [id]);

  const handleDateSelect = (start, end) => {
    setStartDate(start);
    setEndDate(end);
  };

  const handleBooking = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    setSubmitting(true);
    try {
      await createBooking({
        item_id: parseInt(id),
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        notes: bookingNotes,
      });
      toast.success('Booking request sent! The owner will review it.');
      setStartDate(null);
      setEndDate(null);
      setBookingNotes('');
      fetchItem();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (bookingId) => {
    if (reviewRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    setReviewSubmitting(true);
    try {
      await createReview({
        booking_id: bookingId,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success('Review submitted!');
      setReviewRating(0);
      setReviewComment('');
      fetchItem();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container"><div className="loading-state"><div className="spinner spinner-lg" /><span>Loading...</span></div></div>;
  }

  if (!item) return null;

  const isOwner = user?.id === item.owner_id;
  const bookedRanges = item.bookings?.map(b => ({ start_date: b.start_date, end_date: b.end_date })) || [];

  // Find completed bookings by current user for review
  const completedBookings = item.bookings?.filter(b => b.status === 'completed' && b.borrower_id === user?.id) || [];
  const reviewedBookingIds = new Set(item.reviews?.filter(r => r.reviewer_id === user?.id).map(r => r.booking_id) || []);

  return (
    <div className="page-container fade-in">
      <button className="btn btn-ghost mb-2" onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Back
      </button>

      <div className="detail-layout">
        <div>
          {/* Image */}
          <div className="detail-image mb-2">
            {item.image_url ? (
              <img src={item.image_url} alt={item.title} />
            ) : (
              <div className="detail-image-placeholder">
                <Package size={80} strokeWidth={1} />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="card">
            <div className="flex-between mb-1">
              <div className="flex-gap">
                <span className="badge badge-secondary">{item.category}</span>
                <span className="badge badge-neutral">{item.item_condition}</span>
              </div>
              <span className={`badge ${item.is_available ? 'badge-success' : 'badge-danger'}`}>
                {item.is_available ? 'Available' : 'Unavailable'}
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>{item.title}</h1>

            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1.25rem' }}>
              {item.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="flex-gap text-sm">
                <User size={16} style={{ color: 'var(--text-tertiary)' }} />
                <span className="text-muted">Listed by</span>
                <strong>{item.owner_name}</strong>
              </div>

              {item.deposit_amount > 0 && (
                <div className="flex-gap text-sm">
                  <Shield size={16} style={{ color: 'var(--text-tertiary)' }} />
                  <span className="text-muted">Security deposit:</span>
                  <strong style={{ color: 'var(--color-accent)' }}>₹{item.deposit_amount}</strong>
                </div>
              )}

              {item.avg_rating && (
                <div className="flex-gap text-sm">
                  <Star size={16} style={{ color: 'var(--color-accent)' }} />
                  <span>{Math.round(item.avg_rating * 10) / 10}</span>
                  <span className="text-muted">({item.review_count} reviews)</span>
                </div>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div className="card mt-2">
            <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Reviews</h2>
            {item.reviews?.length > 0 ? (
              item.reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="review-avatar">
                      {review.reviewer_name?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{review.reviewer_name}</div>
                      <StarRating rating={review.rating} size={14} />
                    </div>
                  </div>
                  {review.comment && <p className="review-content">{review.comment}</p>}
                </div>
              ))
            ) : (
              <p className="text-muted text-sm">No reviews yet</p>
            )}

            {/* Review form for completed bookings */}
            {completedBookings.filter(b => !reviewedBookingIds.has(b.id)).map(booking => (
              <div key={booking.id} className="card mt-2" style={{ background: 'var(--color-bg-secondary)' }}>
                <h3 className="text-sm font-medium mb-1">Leave a Review</h3>
                <div className="mb-1">
                  <StarRating rating={reviewRating} onChange={setReviewRating} interactive size={24} />
                </div>
                <div className="form-group">
                  <textarea
                    className="form-input"
                    placeholder="Share your experience..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    style={{ minHeight: '80px' }}
                  />
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleReview(booking.id)}
                  disabled={reviewSubmitting}
                >
                  <Send size={14} /> Submit Review
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Sidebar */}
        <div style={{ position: 'sticky', top: '80px' }}>
          {!isOwner && item.is_available ? (
            <div className="card">
              <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
                <Calendar size={20} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.5rem' }} />
                Book This Item
              </h2>

              <BookingCalendar
                bookedRanges={bookedRanges}
                selectedStart={startDate}
                selectedEnd={endDate}
                onSelect={handleDateSelect}
              />

              {startDate && (
                <div className="mt-2" style={{ padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                  <div className="flex-between">
                    <span className="text-muted">From:</span>
                    <strong>{format(startDate, 'MMM d, yyyy')}</strong>
                  </div>
                  {endDate && (
                    <div className="flex-between mt-1">
                      <span className="text-muted">To:</span>
                      <strong>{format(endDate, 'MMM d, yyyy')}</strong>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group mt-2">
                <label>Notes (optional)</label>
                <textarea
                  className="form-input"
                  placeholder="Any special instructions..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  rows={2}
                  style={{ minHeight: '60px' }}
                />
              </div>

              <button
                className="btn btn-primary btn-lg btn-full"
                onClick={handleBooking}
                disabled={!startDate || !endDate || submitting}
                id="submit-booking"
              >
                {submitting ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Request Booking'}
              </button>
            </div>
          ) : isOwner ? (
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Your Item</h3>
              <p className="text-muted text-sm mb-2">This is one of your listed items.</p>
              <button className="btn btn-secondary btn-full" onClick={() => navigate(`/items/edit/${id}`)}>
                Edit Item
              </button>
            </div>
          ) : (
            <div className="card">
              <p className="text-muted text-sm">This item is currently unavailable for booking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
