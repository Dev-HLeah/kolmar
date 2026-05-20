import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env';
import { EvidenceModule } from './evidence/evidence.module';
import { HealthController } from './health/health.controller';
import { ProductsModule } from './products/products.module';
import { ProjectsModule } from './projects/projects.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ProductsModule,
    ProjectsModule,
    EvidenceModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
