import { Router } from 'express';
import db from '../db/init.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/reviews
router.post('/', authenticate, (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;

    if (!booking_id || !rating) {
      return res.status(400).json({ error: 'Booking ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const booking = db.get(`
      SELECT b.*, i.owner_id, i.id as item_id
      FROM bookings b
      JOIN items i ON b.item_id = i.id
      WHERE b.id = ?
    `, [booking_id]);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed bookings' });
    }

    let reviewee_id;
    if (req.user.id === booking.borrower_id) {
      reviewee_id = booking.owner_id;
    } else if (req.user.id === booking.owner_id) {
      reviewee_id = booking.borrower_id;
    } else {
      return res.status(403).json({ error: 'Not authorized to review this booking' });
    }

    const existing = db.get(
      'SELECT id FROM reviews WHERE booking_id = ? AND reviewer_id = ?',
      [booking_id, req.user.id]
    );

    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this booking' });
    }

    const result = db.run(
      'INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, item_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [booking_id, req.user.id, reviewee_id, booking.item_id, rating, comment || '']
    );

    const review = db.get(`
      SELECT r.*, u.name as reviewer_name, u.avatar_url as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json(review);
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Server error creating review' });
  }
});

// GET /api/reviews/user/:id
router.get('/user/:id', authenticate, (req, res) => {
  try {
    const reviews = db.all(`
      SELECT r.*, u.name as reviewer_name, u.avatar_url as reviewer_avatar,
        i.title as item_title
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      JOIN items i ON r.item_id = i.id
      WHERE r.reviewee_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.id]);

    res.json(reviews);
  } catch (err) {
    console.error('List reviews error:', err);
    res.status(500).json({ error: 'Server error listing reviews' });
  }
});

// GET /api/reviews/item/:id
router.get('/item/:id', authenticate, (req, res) => {
  try {
    const reviews = db.all(`
      SELECT r.*, u.name as reviewer_name, u.avatar_url as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.item_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.id]);

    res.json(reviews);
  } catch (err) {
    console.error('List item reviews error:', err);
    res.status(500).json({ error: 'Server error listing reviews' });
  }
});

export default router;
