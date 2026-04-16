import { Router } from 'express';
import db from '../db/init.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Helper: check date overlap
function hasDateConflict(itemId, startDate, endDate, excludeBookingId = null) {
  let sql = `
    SELECT id FROM bookings
    WHERE item_id = ? AND status IN ('approved', 'active')
    AND start_date <= ? AND end_date >= ?
  `;
  const params = [itemId, endDate, startDate];

  if (excludeBookingId) {
    sql += ' AND id != ?';
    params.push(excludeBookingId);
  }

  return db.get(sql, params);
}

// GET /api/bookings - user's bookings (as borrower)
router.get('/', authenticate, (req, res) => {
  try {
    const { role } = req.query;

    let bookings;
    if (role === 'owner') {
      bookings = db.all(`
        SELECT b.*, i.title as item_title, i.image_url as item_image, i.category as item_category,
          u.name as borrower_name, u.avatar_url as borrower_avatar, u.email as borrower_email
        FROM bookings b
        JOIN items i ON b.item_id = i.id
        JOIN users u ON b.borrower_id = u.id
        WHERE i.owner_id = ?
        ORDER BY b.created_at DESC
      `, [req.user.id]);
    } else {
      bookings = db.all(`
        SELECT b.*, i.title as item_title, i.image_url as item_image, i.category as item_category,
          i.owner_id, u.name as owner_name, u.avatar_url as owner_avatar
        FROM bookings b
        JOIN items i ON b.item_id = i.id
        JOIN users u ON i.owner_id = u.id
        WHERE b.borrower_id = ?
        ORDER BY b.created_at DESC
      `, [req.user.id]);
    }

    res.json(bookings);
  } catch (err) {
    console.error('List bookings error:', err);
    res.status(500).json({ error: 'Server error listing bookings' });
  }
});

// POST /api/bookings - create a booking request
router.post('/', authenticate, (req, res) => {
  try {
    const { item_id, start_date, end_date, notes } = req.body;

    if (!item_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Item ID, start date, and end date are required' });
    }

    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    if (new Date(start_date) < new Date(new Date().toDateString())) {
      return res.status(400).json({ error: 'Cannot book dates in the past' });
    }

    const item = db.get('SELECT * FROM items WHERE id = ?', [item_id]);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.owner_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot book your own item' });
    }

    if (!item.is_available) {
      return res.status(400).json({ error: 'Item is not available for booking' });
    }

    const conflict = hasDateConflict(item_id, start_date, end_date);
    if (conflict) {
      return res.status(409).json({ error: 'Dates conflict with an existing booking' });
    }

    const result = db.run(
      'INSERT INTO bookings (item_id, borrower_id, start_date, end_date, notes) VALUES (?, ?, ?, ?, ?)',
      [item_id, req.user.id, start_date, end_date, notes || null]
    );

    const booking = db.get(`
      SELECT b.*, i.title as item_title, i.image_url as item_image
      FROM bookings b
      JOIN items i ON b.item_id = i.id
      WHERE b.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json(booking);
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Server error creating booking' });
  }
});

// PUT /api/bookings/:id/approve
router.put('/:id/approve', authenticate, (req, res) => {
  try {
    const booking = db.get(`
      SELECT b.*, i.owner_id FROM bookings b JOIN items i ON b.item_id = i.id WHERE b.id = ?
    `, [req.params.id]);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.owner_id !== req.user.id) return res.status(403).json({ error: 'Only item owner can approve' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Can only approve pending bookings' });

    const conflict = hasDateConflict(booking.item_id, booking.start_date, booking.end_date, booking.id);
    if (conflict) {
      return res.status(409).json({ error: 'Dates conflict with another approved booking' });
    }

    db.run("UPDATE bookings SET status = 'approved' WHERE id = ?", [req.params.id]);

    const updated = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error('Approve booking error:', err);
    res.status(500).json({ error: 'Server error approving booking' });
  }
});

// PUT /api/bookings/:id/reject
router.put('/:id/reject', authenticate, (req, res) => {
  try {
    const booking = db.get(`
      SELECT b.*, i.owner_id FROM bookings b JOIN items i ON b.item_id = i.id WHERE b.id = ?
    `, [req.params.id]);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.owner_id !== req.user.id) return res.status(403).json({ error: 'Only item owner can reject' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Can only reject pending bookings' });

    db.run("UPDATE bookings SET status = 'rejected' WHERE id = ?", [req.params.id]);

    const updated = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error('Reject booking error:', err);
    res.status(500).json({ error: 'Server error rejecting booking' });
  }
});

// PUT /api/bookings/:id/activate
router.put('/:id/activate', authenticate, (req, res) => {
  try {
    const booking = db.get(`
      SELECT b.*, i.owner_id FROM bookings b JOIN items i ON b.item_id = i.id WHERE b.id = ?
    `, [req.params.id]);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.owner_id !== req.user.id) return res.status(403).json({ error: 'Only item owner can mark as active' });
    if (booking.status !== 'approved') return res.status(400).json({ error: 'Can only activate approved bookings' });

    const { pickup_image_url } = req.body;
    db.run("UPDATE bookings SET status = 'active', pickup_image_url = ? WHERE id = ?",
      [pickup_image_url || null, req.params.id]);

    const updated = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error('Activate booking error:', err);
    res.status(500).json({ error: 'Server error activating booking' });
  }
});

// PUT /api/bookings/:id/complete
router.put('/:id/complete', authenticate, (req, res) => {
  try {
    const booking = db.get(`
      SELECT b.*, i.owner_id FROM bookings b JOIN items i ON b.item_id = i.id WHERE b.id = ?
    `, [req.params.id]);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.owner_id !== req.user.id) return res.status(403).json({ error: 'Only item owner can complete' });
    if (booking.status !== 'active') return res.status(400).json({ error: 'Can only complete active bookings' });

    const { return_image_url } = req.body;
    db.run("UPDATE bookings SET status = 'completed', return_image_url = ? WHERE id = ?",
      [return_image_url || null, req.params.id]);

    const updated = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error('Complete booking error:', err);
    res.status(500).json({ error: 'Server error completing booking' });
  }
});

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', authenticate, (req, res) => {
  try {
    const booking = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.borrower_id !== req.user.id) return res.status(403).json({ error: 'Only borrower can cancel' });
    if (!['pending', 'approved'].includes(booking.status)) {
      return res.status(400).json({ error: 'Can only cancel pending or approved bookings' });
    }

    db.run("UPDATE bookings SET status = 'cancelled' WHERE id = ?", [req.params.id]);

    const updated = db.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Server error cancelling booking' });
  }
});

export default router;
