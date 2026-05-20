import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { ImportJobsService } from './import-jobs.service';

@Module({
  imports: [PrismaModule],
  controllers: [EvidenceController],
  providers: [EvidenceService, ImportJobsService],
})
export class EvidenceModule {}
