import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db/init.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = Router();

// Validation helpers
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9\s\-]{10,16}$/;

function validatePassword(password) {
  if (!password || password.length < 6) return 'Password must be at least 6 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter (A-Z)';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter (a-z)';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one digit (0-9)';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character (!@#$%^&*...)';
  }
  return null;
}

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, community_code } = req.body;

    // --- Required field check ---
    if (!name || !email || !password || !phone || !community_code) {
      return res.status(400).json({ error: 'Name, email, password, phone number, and community code are all required' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters' });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Please enter a valid email address (e.g., user@example.com)' });
    }

    if (!PHONE_REGEX.test(phone.trim())) {
      return res.status(400).json({ error: 'Phone number must be a valid 10–15 digit number' });
    }

    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ error: passErr });

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }

    const password_hash = bcrypt.hashSync(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        password_hash,
        phone: phone.trim(),
        community_code: community_code.trim().toUpperCase(),
        is_verified: true,   // Auto-verified — no OTP required
        otp_code: null,
        otp_expires_at: null,
      },
      select: {
        id: true, name: true, email: true, phone: true, address: true,
        community_code: true, avatar_url: true, bio: true, is_verified: true, created_at: true,
      },
    });

    // Return token immediately — user is logged in right after signup
    const token = generateToken(user);
    res.status(201).json({ message: `Welcome to ShelfNest, ${user.name}!`, user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/verify-otp

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit OTP code are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (user.is_verified) {
      const { password_hash, otp_code, otp_expires_at, ...verifiedUser } = user;
      const token = generateToken(verifiedUser);
      return res.json({ message: 'Account is already verified!', user: verifiedUser, token });
    }

    if (!user.otp_code || user.otp_code !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid 6-digit OTP code. Please check and try again.' });
    }

    if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'OTP code has expired. Please click resend to get a new code.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        otp_code: null,
        otp_expires_at: null,
      },
      select: {
        id: true, name: true, email: true, phone: true, address: true,
        community_code: true, avatar_url: true, bio: true, is_verified: true, created_at: true,
      },
    });

    const token = generateToken(updatedUser);
    res.json({ message: 'Email verified successfully! Welcome to ShelfNest 🎉', user: updatedUser, token });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Server error during OTP verification' });
  }
});

// POST /api/auth/resend-otp
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) return res.status(404).json({ error: 'Account not found' });
    if (user.is_verified) return res.status(400).json({ error: 'Account is already verified' });

    const newOtp = generateOtp();
    const newExpires = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { otp_code: newOtp, otp_expires_at: newExpires },
    });

    console.log(`[OTP RESEND] New 6-digit OTP code for ${cleanEmail}: ${newOtp}`);

    res.json({
      message: 'A new 6-digit OTP code has been generated.',
      email: cleanEmail,
      otp_demo: newOtp,
    });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Server error resending OTP' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Auto-verify the user on successful login (fixes any legacy unverified accounts)
    if (!user.is_verified) {
      await prisma.user.update({
        where: { id: user.id },
        data: { is_verified: true, otp_code: null, otp_expires_at: null },
      });
    }

    const { password_hash, otp_code, otp_expires_at, ...userWithoutPassword } = user;
    userWithoutPassword.is_verified = true;
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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // For security, always return success even if email not found
    if (!user) {
      return res.json({ message: 'If this email is registered, a reset OTP has been sent.' });
    }

    const otpCode = generateOtp();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.user.update({
      where: { id: user.id },
      data: { otp_code: otpCode, otp_expires_at: otpExpires },
    });

    console.log(`[PASSWORD RESET OTP] Generated OTP for ${cleanEmail}: ${otpCode}`);

    res.json({
      message: 'A 6-digit OTP has been sent to your email.',
      email: cleanEmail,
      otp_demo: otpCode, // Remove in production with real email provider
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error during password reset' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    const passErr = validatePassword(newPassword);
    if (passErr) return res.status(400).json({ error: passErr });

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) return res.status(404).json({ error: 'Account not found' });

    if (!user.otp_code || user.otp_code !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid OTP code. Please request a new one.' });
    }

    if (!user.otp_expires_at || new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new reset link.' });
    }

    const password_hash = bcrypt.hashSync(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password_hash, otp_code: null, otp_expires_at: null, is_verified: true },
    });

    res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error resetting password' });
  }
});

export default router;

