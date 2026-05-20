import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEvidenceItemDto } from './dto/create-evidence-item.dto';
import { CreateEvidenceLinkDto } from './dto/create-evidence-link.dto';
import { CreateEvidenceSourceDto } from './dto/create-evidence-source.dto';

const evidenceItemInclude = {
  source: true,
  links: true,
};

@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  createSource(dto: CreateEvidenceSourceDto) {
    return this.prisma.evidenceSource.create({
      data: {
        name: dto.name,
        type: dto.type,
        baseUrl: cleanString(dto.baseUrl),
      },
    });
  }

  findSources() {
    return this.prisma.evidenceSource.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  createItem(dto: CreateEvidenceItemDto) {
    return this.prisma.evidenceItem.create({
      data: {
        sourceId: dto.sourceId,
        title: dto.title,
        summary: cleanString(dto.summary),
        rawText: cleanString(dto.rawText),
        sourceUrl: cleanString(dto.sourceUrl),
        grade: cleanString(dto.grade) ?? 'unreviewed',
      },
      include: evidenceItemInclude,
    });
  }

  findItems() {
    return this.prisma.evidenceItem.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: evidenceItemInclude,
    });
  }

  createLink(dto: CreateEvidenceLinkDto) {
    return this.prisma.evidenceLink.create({
      data: {
        evidenceId: dto.evidenceId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        relation: cleanString(dto.relation),
      },
    });
  }
}

function cleanString(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
