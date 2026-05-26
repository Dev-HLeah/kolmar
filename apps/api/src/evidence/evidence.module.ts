import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { EvidenceController } from './evidence.controller';
import { EvidenceService } from './evidence.service';
import { ImportJobsService } from './import-jobs.service';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { KnowledgeBaseService } from './knowledge-base.service';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [EvidenceController, KnowledgeBaseController],
  providers: [EvidenceService, ImportJobsService, KnowledgeBaseService],
})
export class EvidenceModule {}
