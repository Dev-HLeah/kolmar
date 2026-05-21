import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

const appEnv =
  process.env['APP_ENV'] ??
  (process.env['NODE_ENV'] === 'production' ? 'prd' : 'dev');
const envFileName = `.env.${appEnv}`;

config({ path: `../../${envFileName}` });
config({ path: '../../.env' });
config({ path: envFileName, override: true });
config({ path: '.env', override: true });

const datasourceUrl =
  process.env['DIRECT_URL'] || process.env['DATABASE_URL'] || undefined;

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: datasourceUrl,
  },
});
