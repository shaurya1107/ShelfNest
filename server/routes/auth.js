import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/init.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, email, password, phone, address, community_code } = req.body;

    if (!name || !email || !password || !community_code) {
      return res.status(400).json({ error: 'Name, email, password, and community code are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const result = db.run(
      'INSERT INTO users (name, email, password_hash, phone, address, community_code) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, password_hash, phone || null, address || null, community_code.toUpperCase()]
    );

    const user = db.get(
      'SELECT id, name, email, phone, address, community_code, avatar_url, bio, is_verified, created_at FROM users WHERE id = ?',
      [result.lastInsertRowid]
    );
    const token = generateToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password_hash, ...userWithoutPassword } = user;
    const token = generateToken(user);

    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  try {
    const user = db.get(
      'SELECT id, name, email, phone, address, community_code, avatar_url, bio, is_verified, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, (req, res) => {
  try {
    const { name, phone, address, bio, avatar_url } = req.body;
    const user = db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.run(
      'UPDATE users SET name = ?, phone = ?, address = ?, bio = ?, avatar_url = ? WHERE id = ?',
      [
        name || user.name,
        phone || user.phone,
        address || user.address,
        bio !== undefined ? bio : user.bio,
        avatar_url || user.avatar_url,
        req.user.id
      ]
    );

    const updated = db.get(
      'SELECT id, name, email, phone, address, community_code, avatar_url, bio, is_verified, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json(updated);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// GET /api/auth/user/:id
router.get('/user/:id', authenticate, (req, res) => {
  try {
    const user = db.get(
      'SELECT id, name, email, community_code, avatar_url, bio, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const itemCount = db.get('SELECT COUNT(*) as count FROM items WHERE owner_id = ?', [req.params.id]);
    const avgRating = db.get('SELECT AVG(rating) as avg FROM reviews WHERE reviewee_id = ?', [req.params.id]);
    const reviewCount = db.get('SELECT COUNT(*) as count FROM reviews WHERE reviewee_id = ?', [req.params.id]);

    res.json({
      ...user,
      stats: {
        items_listed: itemCount?.count || 0,
        avg_rating: avgRating?.avg ? Math.round(avgRating.avg * 10) / 10 : null,
        review_count: reviewCount?.count || 0,
      },
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
