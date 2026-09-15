// Reset password for shauryadevesh711@gmail.com
// Usage: node reset_my_password.mjs
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
});

const EMAIL = 'shauryadevesh711@gmail.com';
// New temporary password - meets all requirements
const NEW_PASSWORD = 'Ssss@711';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) {
    console.log(`❌ No user found with email: ${EMAIL}`);
    return;
  }

  console.log(`Found user: ${user.name} (${user.email})`);
  console.log(`Current is_verified: ${user.is_verified}`);

  const hash = bcrypt.hashSync(NEW_PASSWORD, 10);
  await prisma.user.update({
    where: { email: EMAIL },
    data: {
      password_hash: hash,
      is_verified: true,
      otp_code: null,
      otp_expires_at: null,
    }
  });

  console.log(`\n✅ Password reset successfully!`);
  console.log(`   Email:    ${EMAIL}`);
  console.log(`   Password: ${NEW_PASSWORD}`);
  console.log(`   Account is now verified and ready to login.`);
}

main()
  .catch(e => console.error('Error:', e.message))
  .finally(() => prisma.$disconnect());
