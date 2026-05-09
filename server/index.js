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

// Middleware
app.use(cors());
app.use(express.json());
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
  app.listen(PORT, () => {
    console.log(`\n  🏠 ShelfNest API running at http://localhost:${PORT}`);
    console.log(`  📦 Database: PostgreSQL (Prisma ORM)\n`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
