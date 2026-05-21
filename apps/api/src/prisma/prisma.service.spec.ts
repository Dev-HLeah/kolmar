import { resolveDatabaseUrl } from './prisma.service';

describe('resolveDatabaseUrl', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalDirectUrl = process.env.DIRECT_URL;

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.DIRECT_URL = originalDirectUrl;
  });

  it('prefers DATABASE_URL for runtime pooled connections', () => {
    process.env.DATABASE_URL = 'postgresql://runtime-pooler';
    process.env.DIRECT_URL = 'postgresql://migration-direct';

    expect(resolveDatabaseUrl()).toEqual({
      connectionString: 'postgresql://runtime-pooler',
      shouldConnectOnStartup: true,
    });
  });
});
