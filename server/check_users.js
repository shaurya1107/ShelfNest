import prisma from './db/init.js';

async function check() {
  const users = await prisma.user.findMany();
  console.log('Users in DB:');
  users.forEach(u => console.log(`ID: ${u.id} | Name: ${u.name} | Email: ${u.email} | Phone: ${u.phone} | Verified: ${u.is_verified}`));
  process.exit(0);
}

check();
