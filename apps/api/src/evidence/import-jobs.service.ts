import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateImportJobDto,
  RawExternalRecordDto,
} from './dto/create-import-job.dto';

@Injectable()
export class ImportJobsService {
  constructor(private readonly prisma: PrismaService) {}

  findImportJobs() {
    return this.prisma.dataImportJob.findMany({
      orderBy: {
        startedAt: 'desc',
      },
      include: {
        rawRecords: true,
      },
      take: 20,
    });
  }

  createImportJob(dto: CreateImportJobDto) {
    return this.prisma.dataImportJob.create({
      data: {
        sourceName: dto.sourceName,
        status: cleanString(dto.status) ?? 'IMPORTED',
        message: cleanString(dto.message),
        rawRecords: {
          create: (dto.records ?? []).map((record) =>
            toRawExternalRecord(dto.sourceName, record),
          ),
        },
      },
      include: {
        rawRecords: true,
      },
    });
  }
}

function toRawExternalRecord(sourceName: string, record: RawExternalRecordDto) {
  return {
    sourceName,
    externalId: cleanString(record.externalId),
    sourceUrl: cleanString(record.sourceUrl),
    rawPayload: record.rawPayload,
    normalizedStatus: cleanString(record.normalizedStatus) ?? 'PENDING',
    message: cleanString(record.message),
  };
}

function cleanString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
