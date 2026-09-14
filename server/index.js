import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load env vars BEFORE importing db
dotenv.config();

import { initDB } from './db/init.js';

import authRoutes from './routes/auth.js';
import itemRoutes from './routes/items.js';
import bookingRoutes from './routes/bookings.js';
import reviewRoutes from './routes/reviews.js';
import uploadRoutes from './routes/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Required for Render

// CORS — allow local dev + deployed frontend
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Render health checks)
    if (!origin) return callback(null, true);
    // Allow any vercel.app subdomain (covers all preview + production URLs)
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Allow explicitly configured CLIENT_URL + local dev
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());

// Serve local uploads (dev only; production uses Cloudinary URLs)
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'postgresql', timestamp: new Date().toISOString() });
});

// Initialize DB then start server
initDB().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`\n  🏠 ShelfNest API running at http://${HOST}:${PORT}`);
    console.log(`  📦 Database: PostgreSQL (Prisma ORM)\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
