import { Router } from 'express';
import db from '../db/init.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/items - list items in user's community
router.get('/', authenticate, (req, res) => {
  try {
    const user = db.get('SELECT community_code FROM users WHERE id = ?', [req.user.id]);
    const { category, search, available } = req.query;

    let sql = `
      SELECT i.*, u.name as owner_name, u.avatar_url as owner_avatar,
        (SELECT AVG(r.rating) FROM reviews r WHERE r.item_id = i.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.item_id = i.id) as review_count
      FROM items i
      JOIN users u ON i.owner_id = u.id
      WHERE u.community_code = ?
    `;
    const params = [user.community_code];

    if (category && category !== 'all') {
      sql += ' AND i.category = ?';
      params.push(category);
    }

    if (search) {
      sql += ' AND (i.title LIKE ? OR i.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (available === 'true') {
      sql += ' AND i.is_available = 1';
    }

    sql += ' ORDER BY i.created_at DESC';

    const items = db.all(sql, params);
    res.json(items);
  } catch (err) {
    console.error('List items error:', err);
    res.status(500).json({ error: 'Server error listing items' });
  }
});

// GET /api/items/mine - list current user's items
router.get('/mine', authenticate, (req, res) => {
  try {
    const items = db.all(`
      SELECT i.*,
        (SELECT AVG(r.rating) FROM reviews r WHERE r.item_id = i.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.item_id = i.id) as review_count,
        (SELECT COUNT(*) FROM bookings b WHERE b.item_id = i.id AND b.status = 'pending') as pending_requests
      FROM items i
      WHERE i.owner_id = ?
      ORDER BY i.created_at DESC
    `, [req.user.id]);
    res.json(items);
  } catch (err) {
    console.error('List my items error:', err);
    res.status(500).json({ error: 'Server error listing items' });
  }
});

// GET /api/items/:id
router.get('/:id', authenticate, (req, res) => {
  try {
    const item = db.get(`
      SELECT i.*, u.name as owner_name, u.avatar_url as owner_avatar, u.community_code,
        (SELECT AVG(r.rating) FROM reviews r WHERE r.item_id = i.id) as avg_rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.item_id = i.id) as review_count
      FROM items i
      JOIN users u ON i.owner_id = u.id
      WHERE i.id = ?
    `, [req.params.id]);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Get existing bookings for this item (for calendar)
    const bookings = db.all(`
      SELECT id, start_date, end_date, status, borrower_id
      FROM bookings
      WHERE item_id = ? AND status IN ('pending', 'approved', 'active')
    `, [req.params.id]);

    // Get reviews for this item
    const reviews = db.all(`
      SELECT r.*, u.name as reviewer_name, u.avatar_url as reviewer_avatar
      FROM reviews r
      JOIN users u ON r.reviewer_id = u.id
      WHERE r.item_id = ?
      ORDER BY r.created_at DESC
    `, [req.params.id]);

    res.json({ ...item, bookings, reviews });
  } catch (err) {
    console.error('Get item error:', err);
    res.status(500).json({ error: 'Server error getting item' });
  }
});

// POST /api/items
router.post('/', authenticate, (req, res) => {
  try {
    const { title, description, category, item_condition, image_url, deposit_amount } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required' });
    }

    const result = db.run(
      'INSERT INTO items (owner_id, title, description, category, item_condition, image_url, deposit_amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description || '', category, item_condition || 'Good', image_url || null, deposit_amount || 0]
    );

    const item = db.get('SELECT * FROM items WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json(item);
  } catch (err) {
    console.error('Create item error:', err);
    res.status(500).json({ error: 'Server error creating item' });
  }
});

// PUT /api/items/:id
router.put('/:id', authenticate, (req, res) => {
  try {
    const item = db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this item' });
    }

    const { title, description, category, item_condition, image_url, deposit_amount, is_available } = req.body;

    db.run(`
      UPDATE items SET title = ?, description = ?, category = ?, item_condition = ?,
        image_url = ?, deposit_amount = ?, is_available = ?
      WHERE id = ?
    `, [
      title || item.title,
      description !== undefined ? description : item.description,
      category || item.category,
      item_condition || item.item_condition,
      image_url !== undefined ? image_url : item.image_url,
      deposit_amount !== undefined ? deposit_amount : item.deposit_amount,
      is_available !== undefined ? (is_available ? 1 : 0) : item.is_available,
      req.params.id
    ]);

    const updated = db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Server error updating item' });
  }
});

// DELETE /api/items/:id
router.delete('/:id', authenticate, (req, res) => {
  try {
    const item = db.get('SELECT * FROM items WHERE id = ?', [req.params.id]);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this item' });
    }

    const activeBooking = db.get(
      "SELECT id FROM bookings WHERE item_id = ? AND status IN ('pending', 'approved', 'active')",
      [req.params.id]
    );

    if (activeBooking) {
      return res.status(400).json({ error: 'Cannot delete item with active bookings' });
    }

    db.run('DELETE FROM items WHERE id = ?', [req.params.id]);
    res.json({ message: 'Item deleted' });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: 'Server error deleting item' });
  }
});

export default router;
