import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { KnowledgeBaseService } from './knowledge-base.service';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

@Controller('evidence/knowledge-base')
export class KnowledgeBaseController {
  constructor(
    private readonly knowledgeBaseService: KnowledgeBaseService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('sourceName') sourceName: string,
  ) {
    if (!file) throw new BadRequestException('파일을 첨부해주세요.');
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException('PDF, DOCX, TXT 파일만 업로드할 수 있습니다.');
    }
    const source = sourceName?.trim() || '직접 업로드';
    return this.knowledgeBaseService.uploadDocument(file, source);
  }

  @Get()
  getDocuments() {
    return this.knowledgeBaseService.getDocuments();
  }

  @Get(':id')
  getDocument(@Param('id') id: string) {
    return this.knowledgeBaseService.getDocument(id);
  }

  @Post('collect')
  startCollection() {
    const apiKey = this.configService.get<string>('MFDS_API_KEY');
    return this.knowledgeBaseService.startCollectionJob(apiKey);
  }

  @Get('collect/latest')
  getLatestJob() {
    return this.knowledgeBaseService.getLatestCollectionJob();
  }

  @Get('collect/status/:jobId')
  getJobStatus(@Param('jobId') jobId: string) {
    return this.knowledgeBaseService.getCollectionJobStatus(jobId);
  }
}
