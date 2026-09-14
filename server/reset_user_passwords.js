import prisma from './db/init.js';
import bcrypt from 'bcryptjs';

async function reset() {
  const hash = bcrypt.hashSync('PassWord123!', 10);
  
  await prisma.user.updateMany({
    where: { email: { in: ['shauryadevesh711@gmail.com', 'chandranshi.2327csit@kiet.edu', 'tomarchandranshi@gmail.com', 'chandranshitomar4@gmail.com'] } },
    data: { password_hash: hash, is_verified: true },
  });

  // Ensure demo user arjun@example.com exists
  const arjun = await prisma.user.findUnique({ where: { email: 'arjun@example.com' } });
  if (!arjun) {
    await prisma.user.create({
      data: {
        name: 'Arjun Sharma',
        email: 'arjun@example.com',
        password_hash: bcrypt.hashSync('password123', 10),
        phone: '9876543210',
        community_code: 'SHELF2024',
        is_verified: true,
      },
    });
    console.log('Created demo user arjun@example.com');
  } else {
    await prisma.user.update({
      where: { email: 'arjun@example.com' },
      data: { password_hash: bcrypt.hashSync('password123', 10), is_verified: true },
    });
  }

  console.log('✅ Passwords reset successfully!');
  process.exit(0);
}

reset();
