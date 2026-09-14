// Script to mark all existing unverified users as verified
// Run with: node --env-file=.env fix_users.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const unverified = await prisma.user.findMany({
    where: { is_verified: false },
    select: { id: true, name: true, email: true }
  });

  console.log(`Found ${unverified.length} unverified users:`);
  unverified.forEach(u => console.log(`  - ${u.name} (${u.email})`));

  if (unverified.length === 0) {
    console.log('All users already verified!');
    return;
  }

  const updated = await prisma.user.updateMany({
    where: { is_verified: false },
    data: { is_verified: true, otp_code: null, otp_expires_at: null }
  });

  console.log(`\n✅ Marked ${updated.count} users as verified.`);

  const all = await prisma.user.findMany({
    select: { id: true, name: true, email: true, is_verified: true }
  });
  console.log('\nAll users:');
  all.forEach(u => console.log(`  - ${u.name} (${u.email}) — verified: ${u.is_verified}`));
}

main()
  .catch(e => console.error('Error:', e.message))
  .finally(() => prisma.$disconnect());
