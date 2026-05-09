import { Router } from 'express';
import prisma from '../db/init.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Helper: check date overlap
async function hasDateConflict(itemId, startDate, endDate, excludeBookingId = null) {
  const where = {
    item_id: itemId,
    status: { in: ['approved', 'active'] },
    start_date: { lte: endDate },
    end_date: { gte: startDate },
  };

  if (excludeBookingId) {
    where.id = { not: excludeBookingId };
  }

  return prisma.booking.findFirst({ where });
}

// GET /api/bookings - user's bookings
router.get('/', authenticate, async (req, res) => {
  try {
    const { role } = req.query;

    let bookings;
    if (role === 'owner') {
      bookings = await prisma.booking.findMany({
        where: { item: { owner_id: req.user.id } },
        include: {
          item: { select: { title: true, image_url: true, category: true } },
          borrower: { select: { name: true, avatar_url: true, email: true } },
        },
        orderBy: { created_at: 'desc' },
      });

      bookings = bookings.map(b => {
        const { item, borrower, ...rest } = b;
        return {
          ...rest,
          item_title: item.title,
          item_image: item.image_url,
          item_category: item.category,
          borrower_name: borrower.name,
          borrower_avatar: borrower.avatar_url,
          borrower_email: borrower.email,
        };
      });
    } else {
      bookings = await prisma.booking.findMany({
        where: { borrower_id: req.user.id },
        include: {
          item: {
            select: { title: true, image_url: true, category: true, owner_id: true },
            include: { owner: { select: { name: true, avatar_url: true } } },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      bookings = bookings.map(b => {
        const { item, ...rest } = b;
        return {
          ...rest,
          item_title: item.title,
          item_image: item.image_url,
          item_category: item.category,
          owner_id: item.owner_id,
          owner_name: item.owner.name,
          owner_avatar: item.owner.avatar_url,
        };
      });
    }

    res.json(bookings);
  } catch (err) {
    console.error('List bookings error:', err);
    res.status(500).json({ error: 'Server error listing bookings' });
  }
});

// POST /api/bookings - create a booking request
router.post('/', authenticate, async (req, res) => {
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

    const item = await prisma.item.findUnique({ where: { id: parseInt(item_id) } });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.owner_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot book your own item' });
    }

    if (!item.is_available) {
      return res.status(400).json({ error: 'Item is not available for booking' });
    }

    const conflict = await hasDateConflict(parseInt(item_id), start_date, end_date);
    if (conflict) {
      return res.status(409).json({ error: 'Dates conflict with an existing booking' });
    }

    const booking = await prisma.booking.create({
      data: {
        item_id: parseInt(item_id),
        borrower_id: req.user.id,
        start_date,
        end_date,
        notes: notes || null,
      },
      include: {
        item: { select: { title: true, image_url: true } },
      },
    });

    const { item: bookingItem, ...rest } = booking;
    res.status(201).json({
      ...rest,
      item_title: bookingItem.title,
      item_image: bookingItem.image_url,
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Server error creating booking' });
  }
});

// PUT /api/bookings/:id/approve
router.put('/:id/approve', authenticate, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { item: { select: { owner_id: true } } },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.item.owner_id !== req.user.id) return res.status(403).json({ error: 'Only item owner can approve' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Can only approve pending bookings' });

    const conflict = await hasDateConflict(booking.item_id, booking.start_date, booking.end_date, booking.id);
    if (conflict) {
      return res.status(409).json({ error: 'Dates conflict with another approved booking' });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'approved' },
    });

    res.json(updated);
  } catch (err) {
    console.error('Approve booking error:', err);
    res.status(500).json({ error: 'Server error approving booking' });
  }
});

// PUT /api/bookings/:id/reject
router.put('/:id/reject', authenticate, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { item: { select: { owner_id: true } } },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.item.owner_id !== req.user.id) return res.status(403).json({ error: 'Only item owner can reject' });
    if (booking.status !== 'pending') return res.status(400).json({ error: 'Can only reject pending bookings' });

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'rejected' },
    });

    res.json(updated);
  } catch (err) {
    console.error('Reject booking error:', err);
    res.status(500).json({ error: 'Server error rejecting booking' });
  }
});

// PUT /api/bookings/:id/activate
router.put('/:id/activate', authenticate, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { item: { select: { owner_id: true } } },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.item.owner_id !== req.user.id) return res.status(403).json({ error: 'Only item owner can mark as active' });
    if (booking.status !== 'approved') return res.status(400).json({ error: 'Can only activate approved bookings' });

    const { pickup_image_url } = req.body;
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'active', pickup_image_url: pickup_image_url || null },
    });

    res.json(updated);
  } catch (err) {
    console.error('Activate booking error:', err);
    res.status(500).json({ error: 'Server error activating booking' });
  }
});

// PUT /api/bookings/:id/complete
router.put('/:id/complete', authenticate, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { item: { select: { owner_id: true } } },
    });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.item.owner_id !== req.user.id) return res.status(403).json({ error: 'Only item owner can complete' });
    if (booking.status !== 'active') return res.status(400).json({ error: 'Can only complete active bookings' });

    const { return_image_url } = req.body;
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'completed', return_image_url: return_image_url || null },
    });

    res.json(updated);
  } catch (err) {
    console.error('Complete booking error:', err);
    res.status(500).json({ error: 'Server error completing booking' });
  }
});

// PUT /api/bookings/:id/cancel
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });

    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.borrower_id !== req.user.id) return res.status(403).json({ error: 'Only borrower can cancel' });
    if (!['pending', 'approved'].includes(booking.status)) {
      return res.status(400).json({ error: 'Can only cancel pending or approved bookings' });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'cancelled' },
    });

    res.json(updated);
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Server error cancelling booking' });
  }
});

export default router;
