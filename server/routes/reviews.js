import { Router } from 'express';
import prisma from '../db/init.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/reviews
router.post('/', authenticate, async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;

    if (!booking_id || !rating) {
      return res.status(400).json({ error: 'Booking ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(booking_id) },
      include: { item: { select: { owner_id: true, id: true } } },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed bookings' });
    }

    let reviewee_id;
    if (req.user.id === booking.borrower_id) {
      reviewee_id = booking.item.owner_id;
    } else if (req.user.id === booking.item.owner_id) {
      reviewee_id = booking.borrower_id;
    } else {
      return res.status(403).json({ error: 'Not authorized to review this booking' });
    }

    const existing = await prisma.review.findUnique({
      where: {
        booking_id_reviewer_id: {
          booking_id: parseInt(booking_id),
          reviewer_id: req.user.id,
        },
      },
    });

    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this booking' });
    }

    const review = await prisma.review.create({
      data: {
        booking_id: parseInt(booking_id),
        reviewer_id: req.user.id,
        reviewee_id,
        item_id: booking.item.id,
        rating: parseInt(rating),
        comment: comment || '',
      },
      include: {
        reviewer: { select: { name: true, avatar_url: true } },
      },
    });

    res.status(201).json({
      id: review.id,
      booking_id: review.booking_id,
      reviewer_id: review.reviewer_id,
      reviewee_id: review.reviewee_id,
      item_id: review.item_id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at,
      reviewer_name: review.reviewer.name,
      reviewer_avatar: review.reviewer.avatar_url,
    });
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ error: 'Server error creating review' });
  }
});

// GET /api/reviews/user/:id
router.get('/user/:id', authenticate, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { reviewee_id: parseInt(req.params.id) },
      include: {
        reviewer: { select: { name: true, avatar_url: true } },
        item: { select: { title: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const result = reviews.map(r => ({
      id: r.id,
      booking_id: r.booking_id,
      reviewer_id: r.reviewer_id,
      reviewee_id: r.reviewee_id,
      item_id: r.item_id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      reviewer_name: r.reviewer.name,
      reviewer_avatar: r.reviewer.avatar_url,
      item_title: r.item.title,
    }));

    res.json(result);
  } catch (err) {
    console.error('List reviews error:', err);
    res.status(500).json({ error: 'Server error listing reviews' });
  }
});

// GET /api/reviews/item/:id
router.get('/item/:id', authenticate, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { item_id: parseInt(req.params.id) },
      include: {
        reviewer: { select: { name: true, avatar_url: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const result = reviews.map(r => ({
      id: r.id,
      booking_id: r.booking_id,
      reviewer_id: r.reviewer_id,
      reviewee_id: r.reviewee_id,
      item_id: r.item_id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      reviewer_name: r.reviewer.name,
      reviewer_avatar: r.reviewer.avatar_url,
    }));

    res.json(result);
  } catch (err) {
    console.error('List item reviews error:', err);
    res.status(500).json({ error: 'Server error listing reviews' });
  }
});

export default router;
