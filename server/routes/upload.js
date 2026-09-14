import { Router } from 'express';
import multer from 'multer';
import { extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { authenticate } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const useCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let storage;

if (useCloudinary) {
  // Production: store images in Cloudinary
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'shelfnest',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    },
  });
} else {
  // Development fallback: store images on disk
  const uploadsDir = join(__dirname, '..', 'uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + extname(file.originalname));
    },
  });
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

const router = Router();

router.post('/', authenticate, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // Cloudinary returns the full URL in req.file.path
    // Disk storage: build a local /uploads/ URL
    const url = req.file.path || `/uploads/${req.file.filename}`;
    res.json({ url });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error uploading file' });
  }
});

export default router;
