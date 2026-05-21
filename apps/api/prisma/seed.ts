import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { seedDatabase } from '../src/prisma/seed-data';

const appEnv =
  process.env['APP_ENV'] ??
  (process.env['NODE_ENV'] === 'production' ? 'prd' : 'dev');
const envFileName = `.env.${appEnv}`;

config({ path: `../../${envFileName}` });
config({ path: '../../.env' });
config({ path: envFileName, override: true });
config({ path: '.env', override: true });

const connectionString =
  process.env['DATABASE_URL'] || process.env['DIRECT_URL'];

if (!connectionString) {
  throw new Error(
    `DATABASE_URL 또는 DIRECT_URL이 필요합니다. 루트 ${envFileName} 값을 확인하세요.`,
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const summary = await seedDatabase(prisma);

  console.log('Seed completed:', summary);
}

void main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
