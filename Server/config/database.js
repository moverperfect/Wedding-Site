import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import { DATABASE_URL, DATABASE_AUTH_TOKEN } from './keys.js';

if (!DATABASE_URL || !DATABASE_AUTH_TOKEN) {
  throw new Error(
    'Database configuration is incomplete. Please check your environment variables.'
  );
}

if (!DATABASE_URL.startsWith('libsql://')) {
  throw new Error('Invalid DATABASE_URL. URL must start with libsql://');
}

let libsql;
try {
  libsql = createClient({
    url: DATABASE_URL,
    authToken: DATABASE_AUTH_TOKEN,
  });
} catch (error) {
  console.error('Failed to create libsql client');
  throw new Error('Failed to create libsql client');
}

const adapter = new PrismaLibSQL(libsql);
const prisma =
  global.prisma ||
  new PrismaClient({
    adapter,
    log: [
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' }
    ]
  });

prisma.$on('warn', (e) => console.warn(e));
prisma.$on('error', (e) => console.error(e));

async function cleanup() {
  await prisma.$disconnect();
}
process.on('beforeExit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  await cleanup();
  process.exit(1);
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
