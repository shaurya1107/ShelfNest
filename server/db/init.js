import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export async function initDB() {
  try {
    // Verify connection by running a simple query
    await prisma.$connect();
    console.log('  ✅ Connected to PostgreSQL via Prisma');
    return prisma;
  } catch (err) {
    console.error('  ❌ Failed to connect to PostgreSQL:', err.message);
    throw err;
  }
}

export function getDB() {
  return prisma;
}

export default prisma;
