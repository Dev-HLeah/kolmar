import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateEvidenceItemDto } from './dto/create-evidence-item.dto';
import { CreateEvidenceLinkDto } from './dto/create-evidence-link.dto';
import { CreateEvidenceSourceDto } from './dto/create-evidence-source.dto';
import { CreateImportJobDto } from './dto/create-import-job.dto';
import { EvidenceService } from './evidence.service';
import { ImportJobsService } from './import-jobs.service';

@Controller('evidence')
export class EvidenceController {
  constructor(
    private readonly evidenceService: EvidenceService,
    private readonly importJobsService: ImportJobsService,
  ) {}

  @Post('sources')
  createSource(@Body() dto: CreateEvidenceSourceDto) {
    return this.evidenceService.createSource(dto);
  }

  @Get('sources')
  findSources() {
    return this.evidenceService.findSources();
  }

  @Post('items')
  createItem(@Body() dto: CreateEvidenceItemDto) {
    return this.evidenceService.createItem(dto);
  }

  @Get('items')
  findItems() {
    return this.evidenceService.findItems();
  }

  @Post('links')
  createLink(@Body() dto: CreateEvidenceLinkDto) {
    return this.evidenceService.createLink(dto);
  }

  @Post('import-jobs')
  createImportJob(@Body() dto: CreateImportJobDto) {
    return this.importJobsService.createImportJob(dto);
  }
}
