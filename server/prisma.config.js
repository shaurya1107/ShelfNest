import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// Use process.env directly with a fallback so `prisma generate` works
// in build environments where DATABASE_URL is only available at runtime.
// The placeholder is never actually used to connect — only migrations need the real URL.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/shelfnest_placeholder',
  },
});
