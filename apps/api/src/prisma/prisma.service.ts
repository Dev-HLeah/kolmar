import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const LOCAL_FALLBACK_DATABASE_URL =
  'postgresql://user:pass@localhost:5432/kolma';

function resolveDatabaseUrl() {
  const configuredUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

  return {
    connectionString: configuredUrl ?? LOCAL_FALLBACK_DATABASE_URL,
    shouldConnectOnStartup: Boolean(configuredUrl),
  };
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly shouldConnectOnStartup: boolean;

  constructor() {
    const { connectionString, shouldConnectOnStartup } = resolveDatabaseUrl();

    super({
      adapter: new PrismaPg({
        connectionString,
      }),
    });

    this.shouldConnectOnStartup = shouldConnectOnStartup;
  }

  async onModuleInit() {
    if (this.shouldConnectOnStartup) {
      await this.$connect();
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
