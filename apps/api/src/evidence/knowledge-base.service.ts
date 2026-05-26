import { Injectable, Inject, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { PrismaService } from '../prisma/prisma.service';
import { AI_PROVIDER_TOKEN, type AiProvider } from '../ai/ai-provider.interface';

const MFDS_BASE_URL = 'https://openapi.foodsafetykorea.go.kr/api';
const MFDS_INGREDIENT_ENDPOINT = 'I0030/json/1/100'; // 건강기능식품 기준규격 원료 목록

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: AiProvider,
  ) {}

  async uploadDocument(file: Express.Multer.File, sourceName: string) {
    const filename = file.originalname;
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';

    let text: string | undefined;
    let pdfBuffer: Buffer | undefined;

    if (ext === 'pdf') {
      pdfBuffer = file.buffer;
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value;
    } else {
      text = file.buffer.toString('utf-8');
    }

    const summary = await this.aiProvider.analyzeDocument({ text, pdfBuffer, filename });
    const embedding = await this.aiProvider.generateEmbedding(summary);
    const embeddingString = `[${embedding.join(',')}]`;

    const doc = await this.prisma.knowledgeDocument.create({
      data: {
        title: filename.replace(/\.[^.]+$/, ''),
        sourceName,
        fileType: ext,
        summary,
      },
    });

    await this.prisma.$executeRaw`
      INSERT INTO "VectorDocument" (id, "entityType", "entityId", content, metadata, embedding, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        'KnowledgeDocument',
        ${doc.id},
        ${summary},
        ${JSON.stringify({ title: doc.title, sourceName })}::jsonb,
        ${embeddingString}::vector,
        NOW(),
        NOW()
      )
    `;

    return { id: doc.id, title: doc.title, status: 'DONE' };
  }

  async getDocuments() {
    return this.prisma.knowledgeDocument.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getDocument(id: string) {
    return this.prisma.knowledgeDocument.findUnique({ where: { id } });
  }

  async startCollectionJob(apiKey: string | undefined) {
    const job = await this.prisma.collectionJob.create({
      data: { source: 'MFDS', status: 'PENDING' },
    });

    setImmediate(() => {
      void this.runCollectionJob(job.id, apiKey);
    });

    return { jobId: job.id, status: 'PENDING' };
  }

  async getCollectionJobStatus(jobId: string) {
    return this.prisma.collectionJob.findUnique({ where: { id: jobId } });
  }

  async getLatestCollectionJob() {
    return this.prisma.collectionJob.findFirst({
      orderBy: { startedAt: 'desc' },
    });
  }

  private async runCollectionJob(jobId: string, apiKey: string | undefined) {
    await this.prisma.collectionJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING' },
    });

    try {
      if (!apiKey) {
        await this.runPubMedCollection(jobId);
      } else {
        await this.runMfdsCollection(jobId, apiKey);
      }

      await this.prisma.collectionJob.update({
        where: { id: jobId },
        data: { status: 'DONE', finishedAt: new Date() },
      });
    } catch (err) {
      this.logger.error('Collection job failed', err);
      await this.prisma.collectionJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          message: err instanceof Error ? err.message : String(err),
          finishedAt: new Date(),
        },
      });
    }
  }

  private async runPubMedCollection(jobId: string) {
    const terms = [
      'health+functional+food+ingredient+safety',
      'dietary+supplement+ingredient+interaction',
      'nutraceutical+toxicity+threshold',
    ];

    await this.prisma.collectionJob.update({
      where: { id: jobId },
      data: { totalCount: terms.length },
    });

    let done = 0;
    for (const term of terms) {
      const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${term}&retmax=5&retmode=json`;

      const alreadyCollected = await this.prisma.collectedUrl.findUnique({ where: { url } });
      if (alreadyCollected) {
        done++;
        await this.prisma.collectionJob.update({
          where: { id: jobId },
          data: { doneCount: done },
        });
        continue;
      }

      try {
        const res = await fetch(url);
        const data = await res.json() as { esearchresult?: { idlist?: string[] } };
        const ids: string[] = data.esearchresult?.idlist ?? [];

        for (const pmid of ids.slice(0, 3)) {
          await this.collectPubMedArticle(pmid);
        }

        await this.prisma.collectedUrl.create({ data: { url, source: 'PubMed' } });
      } catch (err) {
        this.logger.warn(`PubMed fetch failed for term "${term}": ${String(err)}`);
      }

      done++;
      await this.prisma.collectionJob.update({
        where: { id: jobId },
        data: { doneCount: done },
      });
    }
  }

  private async collectPubMedArticle(pmid: string) {
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`;
    const alreadyCollected = await this.prisma.collectedUrl.findUnique({ where: { url: summaryUrl } });
    if (alreadyCollected) return;

    const res = await fetch(summaryUrl);
    const data = await res.json() as { result?: Record<string, { title?: string; source?: string }> };
    const article = data.result?.[pmid];
    if (!article?.title) return;

    const summary = await this.aiProvider.generateText(
      `다음 논문 제목으로 건강기능식품 배합 연구원에게 유용한 핵심 내용을 한국어로 2-3문장 요약해주세요: "${article.title}"`,
    );
    const embedding = await this.aiProvider.generateEmbedding(summary);
    const embeddingString = `[${embedding.join(',')}]`;

    const doc = await this.prisma.knowledgeDocument.create({
      data: {
        title: article.title.substring(0, 200),
        sourceName: article.source ?? 'PubMed',
        sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        fileType: 'pubmed',
        summary,
      },
    });

    await this.prisma.$executeRaw`
      INSERT INTO "VectorDocument" (id, "entityType", "entityId", content, metadata, embedding, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        'KnowledgeDocument',
        ${doc.id},
        ${summary},
        ${JSON.stringify({ title: doc.title, sourceName: doc.sourceName })}::jsonb,
        ${embeddingString}::vector,
        NOW(),
        NOW()
      )
    `;

    await this.prisma.collectedUrl.create({ data: { url: summaryUrl, source: 'PubMed' } });
  }

  private async runMfdsCollection(jobId: string, apiKey: string) {
    const url = `${MFDS_BASE_URL}/${apiKey}/${MFDS_INGREDIENT_ENDPOINT}`;
    const alreadyCollected = await this.prisma.collectedUrl.findUnique({ where: { url } });

    if (alreadyCollected) {
      await this.prisma.collectionJob.update({
        where: { id: jobId },
        data: { totalCount: 0, doneCount: 0, message: '이미 수집된 데이터입니다.' },
      });
      return;
    }

    const res = await fetch(url);
    const data = await res.json() as { I0030?: { row?: Array<{ PRDLST_NM?: string; MAIN_INGR?: string }> } };
    const rows = data.I0030?.row ?? [];

    await this.prisma.collectionJob.update({
      where: { id: jobId },
      data: { totalCount: rows.length },
    });

    let done = 0;
    for (const row of rows) {
      if (!row.PRDLST_NM) continue;

      const text = `제품명: ${row.PRDLST_NM}\n주요 원료: ${row.MAIN_INGR ?? '정보 없음'}`;
      const summary = await this.aiProvider.generateText(
        `건강기능식품 배합 정보를 한국어로 요약해주세요:\n${text}`,
      );
      const embedding = await this.aiProvider.generateEmbedding(summary);
      const embeddingString = `[${embedding.join(',')}]`;

      const doc = await this.prisma.knowledgeDocument.create({
        data: {
          title: row.PRDLST_NM.substring(0, 200),
          sourceName: '식약처 건강기능식품 기준규격',
          fileType: 'mfds',
          summary,
        },
      });

      await this.prisma.$executeRaw`
        INSERT INTO "VectorDocument" (id, "entityType", "entityId", content, metadata, embedding, "createdAt", "updatedAt")
        VALUES (
          gen_random_uuid()::text,
          'KnowledgeDocument',
          ${doc.id},
          ${summary},
          ${JSON.stringify({ title: doc.title, sourceName: '식약처' })}::jsonb,
          ${embeddingString}::vector,
          NOW(),
          NOW()
        )
      `;

      done++;
      await this.prisma.collectionJob.update({
        where: { id: jobId },
        data: { doneCount: done },
      });
    }

    await this.prisma.collectedUrl.create({ data: { url, source: 'MFDS' } });
  }
}
