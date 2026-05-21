import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiModule } from './ai/ai.module';
import { AuditLogModule } from './audit/audit-log.module';
import { AuthModule } from './auth/auth.module';
import { getEnvFilePaths, validateEnv } from './config/env';
import { EvidenceModule } from './evidence/evidence.module';
import { HealthController } from './health/health.controller';
import { ProductsModule } from './products/products.module';
import { ProjectsModule } from './projects/projects.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: getEnvFilePaths(),
      isGlobal: true,
      validate: validateEnv,
    }),
    AuthModule,
    ProductsModule,
    ProjectsModule,
    EvidenceModule,
    SearchModule,
    AiModule,
    AuditLogModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
