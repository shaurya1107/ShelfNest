import { Router } from 'express';
import prisma from '../db/init.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/items - list items in user's community
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { community_code: true },
    });
    const { category, search, available } = req.query;

    const where = {
      owner: { community_code: user.community_code },
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (available === 'true') {
      where.is_available = true;
    }

    const items = await prisma.item.findMany({
      where,
      include: {
        owner: { select: { name: true, avatar_url: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    // Transform to match existing API shape
    const result = items.map(item => {
      const { owner, reviews, ...rest } = item;
      const avg_rating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;
      return {
        ...rest,
        owner_name: owner.name,
        owner_avatar: owner.avatar_url,
        avg_rating,
        review_count: reviews.length,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('List items error:', err);
    res.status(500).json({ error: 'Server error listing items' });
  }
});

// GET /api/items/mine - list current user's items
router.get('/mine', authenticate, async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      where: { owner_id: req.user.id },
      include: {
        reviews: { select: { rating: true } },
        bookings: { where: { status: 'pending' }, select: { id: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const result = items.map(item => {
      const { reviews, bookings, ...rest } = item;
      const avg_rating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : null;
      return {
        ...rest,
        avg_rating,
        review_count: reviews.length,
        pending_requests: bookings.length,
      };
    });

    res.json(result);
  } catch (err) {
    console.error('List my items error:', err);
    res.status(500).json({ error: 'Server error listing items' });
  }
});

// GET /api/items/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        owner: { select: { name: true, avatar_url: true, community_code: true } },
        reviews: {
          include: { reviewer: { select: { name: true, avatar_url: true } } },
          orderBy: { created_at: 'desc' },
        },
        bookings: {
          where: { status: { in: ['pending', 'approved', 'active'] } },
          select: { id: true, start_date: true, end_date: true, status: true, borrower_id: true },
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Get all bookings for this item (including completed ones for review eligibility)
    const allBookings = await prisma.booking.findMany({
      where: { item_id: itemId },
      select: { id: true, start_date: true, end_date: true, status: true, borrower_id: true },
    });

    // Compute avg_rating
    const avg_rating = item.reviews.length > 0
      ? item.reviews.reduce((sum, r) => sum + r.rating, 0) / item.reviews.length
      : null;

    // Transform reviews shape
    const reviews = item.reviews.map(r => ({
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

    res.json({
      id: item.id,
      owner_id: item.owner_id,
      title: item.title,
      description: item.description,
      category: item.category,
      item_condition: item.item_condition,
      image_url: item.image_url,
      deposit_amount: item.deposit_amount,
      is_available: item.is_available,
      created_at: item.created_at,
      owner_name: item.owner.name,
      owner_avatar: item.owner.avatar_url,
      community_code: item.owner.community_code,
      avg_rating,
      review_count: item.reviews.length,
      bookings: allBookings,
      reviews,
    });
  } catch (err) {
    console.error('Get item error:', err);
    res.status(500).json({ error: 'Server error getting item' });
  }
});

// POST /api/items
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, category, item_condition, image_url, deposit_amount } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const item = await prisma.item.create({
      data: {
        owner_id: req.user.id,
        title,
        description: description || '',
        category,
        item_condition: item_condition || 'Good',
        image_url: image_url || null,
        deposit_amount: deposit_amount || 0,
      },
    });

    res.status(201).json(item);
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Server error creating item' });
  }
});

// PUT /api/items/:id
router.put('/:id', authenticate, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const item = await prisma.item.findUnique({ where: { id: itemId } });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this item' });
    }

    const { title, description, category, item_condition, image_url, deposit_amount, is_available } = req.body;

    const updated = await prisma.item.update({
      where: { id: itemId },
      data: {
        title: title || item.title,
        description: description !== undefined ? description : item.description,
        category: category || item.category,
        item_condition: item_condition || item.item_condition,
        image_url: image_url !== undefined ? image_url : item.image_url,
        deposit_amount: deposit_amount !== undefined ? deposit_amount : item.deposit_amount,
        is_available: is_available !== undefined ? Boolean(is_available) : item.is_available,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Server error updating item' });
  }
});

// DELETE /api/items/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const item = await prisma.item.findUnique({ where: { id: itemId } });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }

    const activeBooking = await prisma.booking.findFirst({
      where: {
        item_id: itemId,
        status: { in: ['pending', 'approved', 'active'] },
      },
    });

    if (activeBooking) {
      return res.status(400).json({ error: 'Cannot delete item with active bookings' });
    }

    await prisma.item.delete({ where: { id: itemId } });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: 'Server error deleting item' });
  }
});

export default router;
