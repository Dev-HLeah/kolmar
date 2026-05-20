import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: '../../.env' });
config({ path: '.env', override: true });

const datasourceUrl = process.env['DIRECT_URL'] ?? process.env['DATABASE_URL'];

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: datasourceUrl,
  },
});
