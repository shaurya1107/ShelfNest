import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Clear existing data in correct order (respecting foreign keys)
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.item.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const password = bcrypt.hashSync('password123', 10);

  const usersData = [
    { name: 'Arjun Mehta', email: 'arjun@example.com', phone: '9876543210', address: '12 Green Park, Sector 5', community_code: 'SHELF2024', bio: 'Love sharing tools with neighbors!' },
    { name: 'Priya Sharma', email: 'priya@example.com', phone: '9876543211', address: '34 Rose Garden, Sector 5', community_code: 'SHELF2024', bio: 'DIY enthusiast. Borrow my tools anytime!' },
    { name: 'Rahul Verma', email: 'rahul@example.com', phone: '9876543212', address: '56 Palm Avenue, Sector 5', community_code: 'SHELF2024', bio: 'Handy neighbor, always happy to help.' },
    { name: 'Sneha Patel', email: 'sneha@example.com', phone: '9876543213', address: '78 Jasmine Lane, Sector 5', community_code: 'SHELF2024', bio: 'Cooking and crafting are my passions.' },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: { ...u, password_hash: password },
    });
    users.push(user);
  }

  console.log(`  ✅ Created ${users.length} users`);

  // Create items
  const itemsData = [
    { ownerIdx: 0, title: 'Bosch Power Drill', description: 'Professional-grade cordless drill with multiple bits. Battery lasts 4+ hours.', category: 'Tools', item_condition: 'Excellent', deposit_amount: 500 },
    { ownerIdx: 0, title: 'Extension Ladder (20ft)', description: 'Aluminium folding ladder, perfect for painting or repairs. Lightweight and sturdy.', category: 'Tools', item_condition: 'Good', deposit_amount: 300 },
    { ownerIdx: 1, title: 'KitchenAid Stand Mixer', description: 'Professional 5-quart mixer. Great for baking. Includes 3 attachments.', category: 'Kitchen', item_condition: 'Like New', deposit_amount: 800 },
    { ownerIdx: 1, title: 'Pressure Washer', description: 'Electric pressure washer, 2000 PSI. Perfect for cleaning driveways and patios.', category: 'Tools', item_condition: 'Good', deposit_amount: 400 },
    { ownerIdx: 2, title: 'Camping Tent (4-person)', description: 'Waterproof dome tent with rainfly. Easy 10-minute setup. Used only twice.', category: 'Outdoor', item_condition: 'Excellent', deposit_amount: 600 },
    { ownerIdx: 2, title: 'Portable Projector', description: 'HD projector with built-in speaker. Perfect for movie nights or presentations.', category: 'Electronics', item_condition: 'Good', deposit_amount: 700 },
    { ownerIdx: 3, title: 'Sewing Machine', description: 'Brother CS6000i computerized sewing machine. Great for beginners and experts.', category: 'Crafts', item_condition: 'Excellent', deposit_amount: 500 },
    { ownerIdx: 3, title: 'Instant Pot Duo (8 Qt)', description: 'Large capacity pressure cooker. 7-in-1 functionality. Makes meal prep easy.', category: 'Kitchen', item_condition: 'Like New', deposit_amount: 300 },
    { ownerIdx: 0, title: 'Circular Saw', description: 'DeWalt 7-1/4" circular saw. Powerful and precise. Comes with carrying case.', category: 'Tools', item_condition: 'Good', deposit_amount: 400 },
    { ownerIdx: 1, title: 'DSLR Camera (Canon)', description: 'Canon EOS Rebel T7 with 18-55mm lens. Perfect for events and travel photography.', category: 'Electronics', item_condition: 'Excellent', deposit_amount: 1500 },
  ];

  const items = [];
  for (const { ownerIdx, ...data } of itemsData) {
    const item = await prisma.item.create({
      data: { ...data, owner_id: users[ownerIdx].id },
    });
    items.push(item);
  }

  console.log(`  ✅ Created ${items.length} items`);

  // Create bookings
  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  const bookingsData = [
    { itemIdx: 0, borrowerIdx: 2, start: addDays(today, -20), end: addDays(today, -15), status: 'completed' },
    { itemIdx: 2, borrowerIdx: 3, start: addDays(today, -3), end: addDays(today, 4), status: 'active' },
    { itemIdx: 5, borrowerIdx: 0, start: addDays(today, 5), end: addDays(today, 8), status: 'approved' },
    { itemIdx: 6, borrowerIdx: 1, start: addDays(today, 10), end: addDays(today, 14), status: 'pending' },
  ];

  const bookings = [];
  for (const b of bookingsData) {
    const booking = await prisma.booking.create({
      data: {
        item_id: items[b.itemIdx].id,
        borrower_id: users[b.borrowerIdx].id,
        start_date: formatDate(b.start),
        end_date: formatDate(b.end),
        status: b.status,
      },
    });
    bookings.push(booking);
  }

  console.log(`  ✅ Created ${bookings.length} bookings`);

  // Create reviews for completed booking
  await prisma.review.create({
    data: {
      booking_id: bookings[0].id,
      reviewer_id: users[2].id,
      reviewee_id: users[0].id,
      item_id: items[0].id,
      rating: 5,
      comment: 'Amazing drill! Arjun kept it in perfect condition. Highly recommend borrowing from him.',
    },
  });

  await prisma.review.create({
    data: {
      booking_id: bookings[0].id,
      reviewer_id: users[0].id,
      reviewee_id: users[2].id,
      item_id: items[0].id,
      rating: 4,
      comment: 'Rahul returned everything on time and in great shape. Happy to lend again!',
    },
  });

  console.log(`  ✅ Created 2 reviews`);

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo accounts (password: password123):');
  console.log('  📧 arjun@example.com');
  console.log('  📧 priya@example.com');
  console.log('  📧 rahul@example.com');
  console.log('  📧 sneha@example.com');
  console.log(`\n  Community Code: SHELF2024\n`);

  await prisma.$disconnect();
  await pool.end();
}

seed().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
});
