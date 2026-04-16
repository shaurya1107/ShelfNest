import { initDB, run, get, all, saveDB } from './init.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('🌱 Seeding database...\n');

  await initDB();

  // Clear existing data
  run('DELETE FROM reviews');
  run('DELETE FROM bookings');
  run('DELETE FROM items');
  run('DELETE FROM users');

  // Create users
  const password = bcrypt.hashSync('password123', 10);

  const users = [
    { name: 'Arjun Mehta', email: 'arjun@example.com', phone: '9876543210', address: '12 Green Park, Sector 5', community_code: 'SHELF2024', bio: 'Love sharing tools with neighbors!' },
    { name: 'Priya Sharma', email: 'priya@example.com', phone: '9876543211', address: '34 Rose Garden, Sector 5', community_code: 'SHELF2024', bio: 'DIY enthusiast. Borrow my tools anytime!' },
    { name: 'Rahul Verma', email: 'rahul@example.com', phone: '9876543212', address: '56 Palm Avenue, Sector 5', community_code: 'SHELF2024', bio: 'Handy neighbor, always happy to help.' },
    { name: 'Sneha Patel', email: 'sneha@example.com', phone: '9876543213', address: '78 Jasmine Lane, Sector 5', community_code: 'SHELF2024', bio: 'Cooking and crafting are my passions.' },
  ];

  const userIds = [];
  for (const u of users) {
    const result = run(
      'INSERT INTO users (name, email, password_hash, phone, address, community_code, bio) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [u.name, u.email, password, u.phone, u.address, u.community_code, u.bio]
    );
    userIds.push(result.lastInsertRowid);
  }

  console.log(`  ✅ Created ${users.length} users`);

  // Create items
  const items = [
    { owner_idx: 0, title: 'Bosch Power Drill', description: 'Professional-grade cordless drill with multiple bits. Battery lasts 4+ hours.', category: 'Tools', item_condition: 'Excellent', deposit: 500 },
    { owner_idx: 0, title: 'Extension Ladder (20ft)', description: 'Aluminium folding ladder, perfect for painting or repairs. Lightweight and sturdy.', category: 'Tools', item_condition: 'Good', deposit: 300 },
    { owner_idx: 1, title: 'KitchenAid Stand Mixer', description: 'Professional 5-quart mixer. Great for baking. Includes 3 attachments.', category: 'Kitchen', item_condition: 'Like New', deposit: 800 },
    { owner_idx: 1, title: 'Pressure Washer', description: 'Electric pressure washer, 2000 PSI. Perfect for cleaning driveways and patios.', category: 'Tools', item_condition: 'Good', deposit: 400 },
    { owner_idx: 2, title: 'Camping Tent (4-person)', description: 'Waterproof dome tent with rainfly. Easy 10-minute setup. Used only twice.', category: 'Outdoor', item_condition: 'Excellent', deposit: 600 },
    { owner_idx: 2, title: 'Portable Projector', description: 'HD projector with built-in speaker. Perfect for movie nights or presentations.', category: 'Electronics', item_condition: 'Good', deposit: 700 },
    { owner_idx: 3, title: 'Sewing Machine', description: 'Brother CS6000i computerized sewing machine. Great for beginners and experts.', category: 'Crafts', item_condition: 'Excellent', deposit: 500 },
    { owner_idx: 3, title: 'Instant Pot Duo (8 Qt)', description: 'Large capacity pressure cooker. 7-in-1 functionality. Makes meal prep easy.', category: 'Kitchen', item_condition: 'Like New', deposit: 300 },
    { owner_idx: 0, title: 'Circular Saw', description: 'DeWalt 7-1/4" circular saw. Powerful and precise. Comes with carrying case.', category: 'Tools', item_condition: 'Good', deposit: 400 },
    { owner_idx: 1, title: 'DSLR Camera (Canon)', description: 'Canon EOS Rebel T7 with 18-55mm lens. Perfect for events and travel photography.', category: 'Electronics', item_condition: 'Excellent', deposit: 1500 },
  ];

  const itemIds = [];
  for (const item of items) {
    const result = run(
      'INSERT INTO items (owner_id, title, description, category, item_condition, deposit_amount) VALUES (?, ?, ?, ?, ?, ?)',
      [userIds[item.owner_idx], item.title, item.description, item.category, item.item_condition, item.deposit]
    );
    itemIds.push(result.lastInsertRowid);
  }

  console.log(`  ✅ Created ${items.length} items`);

  // Create some bookings
  const today = new Date();
  const formatDate = (d) => d.toISOString().split('T')[0];
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

  const bookings = [
    { item_idx: 0, borrower_idx: 2, start: addDays(today, -20), end: addDays(today, -15), status: 'completed' },
    { item_idx: 2, borrower_idx: 3, start: addDays(today, -3), end: addDays(today, 4), status: 'active' },
    { item_idx: 5, borrower_idx: 0, start: addDays(today, 5), end: addDays(today, 8), status: 'approved' },
    { item_idx: 6, borrower_idx: 1, start: addDays(today, 10), end: addDays(today, 14), status: 'pending' },
  ];

  const bookingIds = [];
  for (const b of bookings) {
    const result = run(
      'INSERT INTO bookings (item_id, borrower_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)',
      [itemIds[b.item_idx], userIds[b.borrower_idx], formatDate(b.start), formatDate(b.end), b.status]
    );
    bookingIds.push(result.lastInsertRowid);
  }

  console.log(`  ✅ Created ${bookings.length} bookings`);

  // Create reviews for completed bookings
  run(
    'INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, item_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
    [bookingIds[0], userIds[2], userIds[0], itemIds[0], 5, 'Amazing drill! Arjun kept it in perfect condition. Highly recommend borrowing from him.']
  );
  run(
    'INSERT INTO reviews (booking_id, reviewer_id, reviewee_id, item_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
    [bookingIds[0], userIds[0], userIds[2], itemIds[0], 4, 'Rahul returned everything on time and in great shape. Happy to lend again!']
  );

  console.log(`  ✅ Created 2 reviews`);

  saveDB();

  console.log('\n🎉 Seed complete!\n');
  console.log('Demo accounts (password: password123):');
  console.log('  📧 arjun@example.com');
  console.log('  📧 priya@example.com');
  console.log('  📧 rahul@example.com');
  console.log('  📧 sneha@example.com');
  console.log(`\n  Community Code: SHELF2024\n`);
}

seed().catch(console.error);
