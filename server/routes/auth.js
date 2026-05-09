import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db/init.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, community_code } = req.body;

    if (!name || !email || !password || !community_code) {
      return res.status(400).json({ error: 'Name, email, password, and community code are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = bcrypt.hashSync(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        phone: phone || null,
        address: address || null,
        community_code: community_code.toUpperCase(),
      },
      select: {
        id: true, name: true, email: true, phone: true, address: true,
        community_code: true, avatar_url: true, bio: true, is_verified: true, created_at: true,
      },
    });

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
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
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, name: true, email: true, phone: true, address: true,
        community_code: true, avatar_url: true, bio: true, is_verified: true, created_at: true,
      },
    });

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
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, address, bio, avatar_url } = req.body;
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        name: name || currentUser.name,
        phone: phone || currentUser.phone,
        address: address || currentUser.address,
        bio: bio !== undefined ? bio : currentUser.bio,
        avatar_url: avatar_url || currentUser.avatar_url,
      },
      select: {
        id: true, name: true, email: true, phone: true, address: true,
        community_code: true, avatar_url: true, bio: true, is_verified: true, created_at: true,
      },
    });

    res.json(updated);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error updating profile' });
  }
});

// GET /api/auth/user/:id
router.get('/user/:id', authenticate, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, community_code: true,
        avatar_url: true, bio: true, created_at: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [itemCount, avgRating, reviewCount] = await Promise.all([
      prisma.item.count({ where: { owner_id: userId } }),
      prisma.review.aggregate({ where: { reviewee_id: userId }, _avg: { rating: true } }),
      prisma.review.count({ where: { reviewee_id: userId } }),
    ]);

    res.json({
      ...user,
      stats: {
        items_listed: itemCount,
        avg_rating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : null,
        review_count: reviewCount,
      },
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
