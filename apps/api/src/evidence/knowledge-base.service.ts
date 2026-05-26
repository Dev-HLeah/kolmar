import { Injectable, Inject, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { PrismaService } from '../prisma/prisma.service';
import { AI_PROVIDER_TOKEN, type AiProvider } from '../ai/ai-provider.interface';

const MFDS_BASE_URL = 'https://openapi.foodsafetykorea.go.kr/api';
const MFDS_INGREDIENT_ENDPOINT = 'I0030/json/1/100';

const PUBMED_TERMS = [
  'health+functional+food+ingredient+safety',
  'dietary+supplement+ingredient+interaction',
  'nutraceutical+toxicity+threshold',
];

// 건강기능식품 주요 원료 (CAS명 / IUPAC명으로 PubChem 검색)
const PUBCHEM_INGREDIENTS = [
  { name: 'ascorbic acid', korean: '비타민 C' },
  { name: 'tocopherol', korean: '비타민 E' },
  { name: 'cholecalciferol', korean: '비타민 D3' },
  { name: 'cyanocobalamin', korean: '비타민 B12' },
  { name: 'zinc sulfate', korean: '황산아연' },
  { name: 'magnesium oxide', korean: '산화마그네슘' },
  { name: 'ferrous sulfate', korean: '황산철(II)' },
  { name: 'calcium carbonate', korean: '탄산칼슘' },
  { name: 'docosahexaenoic acid', korean: 'DHA(오메가-3)' },
  { name: 'ubiquinone', korean: '코엔자임Q10' },
  { name: 'glucosamine', korean: '글루코사민' },
  { name: 'lutein', korean: '루테인' },
  { name: 'beta-carotene', korean: '베타카로틴' },
  { name: 'hyaluronic acid', korean: '히알루론산' },
  { name: 'collagen', korean: '콜라겐' },
];

// OpenFDA 부작용 검색 원료
const OPENFDA_INGREDIENTS = [
  'vitamin c',
  'vitamin e',
  'zinc',
  'magnesium',
  'iron supplement',
  'calcium supplement',
  'vitamin d',
  'omega-3',
  'coenzyme q10',
  'glucosamine',
];

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

    const doc = await this.prisma.knowledgeDocument.create({
      data: { title: filename.replace(/\.[^.]+$/, ''), sourceName, fileType: ext, summary },
    });

    await this.saveVectorDocument(doc.id, summary, { title: doc.title, sourceName }, embedding);
    return { id: doc.id, title: doc.title, status: 'DONE' };
  }

  getDocuments() {
    return this.prisma.knowledgeDocument.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  }

  getDocument(id: string) {
    return this.prisma.knowledgeDocument.findUnique({ where: { id } });
  }

  async startCollectionJob(apiKey: string | undefined) {
    const job = await this.prisma.collectionJob.create({
      data: { source: 'ALL', status: 'PENDING' },
    });
    setImmediate(() => void this.runCollectionJob(job.id, apiKey));
    return { jobId: job.id, status: 'PENDING' };
  }

  getCollectionJobStatus(jobId: string) {
    return this.prisma.collectionJob.findUnique({ where: { id: jobId } });
  }

  getLatestCollectionJob() {
    return this.prisma.collectionJob.findFirst({ orderBy: { startedAt: 'desc' } });
  }

  // ─── private: orchestration ──────────────────────────────────────────

  private async runCollectionJob(jobId: string, apiKey: string | undefined) {
    const total =
      PUBMED_TERMS.length +
      PUBCHEM_INGREDIENTS.length +
      OPENFDA_INGREDIENTS.length +
      (apiKey ? 1 : 0);

    await this.prisma.collectionJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', totalCount: total },
    });

    try {
      await this.runPubMedCollection(jobId);
      await this.runPubChemCollection(jobId);
      await this.runOpenFdaCollection(jobId);
      if (apiKey) await this.runMfdsCollection(jobId, apiKey);

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

  // ─── PubMed ──────────────────────────────────────────────────────────

  private async runPubMedCollection(jobId: string) {
    for (const term of PUBMED_TERMS) {
      const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${term}&retmax=5&retmode=json`;
      const alreadyCollected = await this.prisma.collectedUrl.findUnique({ where: { url } });

      if (!alreadyCollected) {
        try {
          const res = await fetch(url);
          const data = await res.json() as { esearchresult?: { idlist?: string[] } };
          const ids = data.esearchresult?.idlist ?? [];
          for (const pmid of ids.slice(0, 3)) {
            await this.collectPubMedArticle(pmid);
            await delay(300);
          }
          await this.prisma.collectedUrl.create({ data: { url, source: 'PubMed' } });
        } catch (err) {
          this.logger.warn(`PubMed fetch failed for "${term}": ${String(err)}`);
        }
      }

      await this.incrementDone(jobId);
    }
  }

  private async collectPubMedArticle(pmid: string) {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${pmid}&retmode=json`;
    if (await this.prisma.collectedUrl.findUnique({ where: { url } })) return;

    const res = await fetch(url);
    const data = await res.json() as { result?: Record<string, { title?: string; source?: string }> };
    const article = data.result?.[pmid];
    if (!article?.title) return;

    const summary = await this.aiProvider.generateText(
      `다음 논문 제목으로 건강기능식품 배합 연구원에게 유용한 핵심 내용을 한국어로 2-3문장 요약:\n"${article.title}"`,
    );
    const embedding = await this.aiProvider.generateEmbedding(summary);

    const doc = await this.prisma.knowledgeDocument.create({
      data: {
        title: article.title.substring(0, 200),
        sourceName: article.source ?? 'PubMed',
        sourceUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        fileType: 'pubmed',
        summary,
      },
    });

    await this.saveVectorDocument(doc.id, summary, { title: doc.title, sourceName: doc.sourceName }, embedding);
    await this.prisma.collectedUrl.create({ data: { url, source: 'PubMed' } });
  }

  // ─── PubChem ─────────────────────────────────────────────────────────

  private async runPubChemCollection(jobId: string) {
    await this.updateJobMessage(jobId, 'PubChem 원료 안전성 수집 중...');

    for (const ingredient of PUBCHEM_INGREDIENTS) {
      const searchUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(ingredient.name)}/cids/JSON`;

      if (await this.prisma.collectedUrl.findUnique({ where: { url: searchUrl } })) {
        await this.incrementDone(jobId);
        continue;
      }

      try {
        const cidRes = await fetch(searchUrl);
        if (!cidRes.ok) throw new Error(`HTTP ${cidRes.status}`);
        const cidData = await cidRes.json() as { IdentifierList?: { CID?: number[] } };
        const cid = cidData.IdentifierList?.CID?.[0];
        if (!cid) throw new Error('CID not found');

        await delay(300);

        const descUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/description/JSON`;
        const descRes = await fetch(descUrl);
        const descData = await descRes.json() as {
          InformationList?: { Information?: Array<{ Description?: string; DescriptionSourceName?: string }> }
        };
        const descriptions = descData.InformationList?.Information
          ?.filter((i) => i.Description)
          .map((i) => i.Description!)
          .slice(0, 3)
          .join('\n') ?? '';

        if (!descriptions) throw new Error('No description');

        await delay(300);

        // GHS 안전 데이터 추가 조회
        const ghsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound/${cid}/JSON?heading=GHS+Classification`;
        let ghsText = '';
        try {
          const ghsRes = await fetch(ghsUrl);
          if (ghsRes.ok) {
            const ghsData = await ghsRes.json() as { Record?: { Section?: Array<{ TOCHeading?: string; Information?: Array<{ Value?: { StringWithMarkup?: Array<{ String?: string }> } }> }> } };
            const section = ghsData.Record?.Section?.[0];
            if (section?.Information) {
              ghsText = section.Information
                .flatMap((info) => info.Value?.StringWithMarkup?.map((s) => s.String) ?? [])
                .filter(Boolean)
                .slice(0, 5)
                .join(', ');
            }
          }
        } catch {
          // GHS 데이터는 선택 사항
        }

        const rawContent = [
          `원료명: ${ingredient.korean} (${ingredient.name})`,
          `PubChem CID: ${cid}`,
          `설명:\n${descriptions}`,
          ghsText ? `GHS 안전 분류: ${ghsText}` : '',
        ].filter(Boolean).join('\n\n');

        const summary = await this.aiProvider.generateText(
          `다음 원료의 정보를 건강기능식품 배합 연구원 관점에서 한국어로 요약해주세요.\n` +
          `특히 독성, 안전 용량, 다른 원료와의 상호작용, 주의사항을 중심으로.\n\n${rawContent}`,
        );
        const embedding = await this.aiProvider.generateEmbedding(summary);

        const doc = await this.prisma.knowledgeDocument.create({
          data: {
            title: `${ingredient.korean} 안전성 데이터 (PubChem)`,
            sourceName: 'PubChem (NIH)',
            sourceUrl: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
            fileType: 'pubchem',
            summary,
          },
        });

        await this.saveVectorDocument(doc.id, summary, { title: doc.title, sourceName: 'PubChem' }, embedding);
        await this.prisma.collectedUrl.create({ data: { url: searchUrl, source: 'PubChem' } });
        await delay(300);
      } catch (err) {
        this.logger.warn(`PubChem failed for "${ingredient.name}": ${String(err)}`);
      }

      await this.incrementDone(jobId);
    }
  }

  // ─── OpenFDA ─────────────────────────────────────────────────────────

  private async runOpenFdaCollection(jobId: string) {
    await this.updateJobMessage(jobId, 'OpenFDA 부작용 데이터 수집 중...');

    for (const ingredient of OPENFDA_INGREDIENTS) {
      const searchUrl = `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:"${encodeURIComponent(ingredient)}"&limit=5`;

      if (await this.prisma.collectedUrl.findUnique({ where: { url: searchUrl } })) {
        await this.incrementDone(jobId);
        continue;
      }

      try {
        const res = await fetch(searchUrl, {
          headers: { 'User-Agent': 'KolmaRnD/1.0 (research tool)' },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        type FdaReaction = { reactionmeddrapt?: string };
        type FdaDrug = { medicinalproduct?: string };
        type FdaResult = {
          patient?: { reaction?: FdaReaction[]; drug?: FdaDrug[] };
          primarysource?: { qualification?: string };
        };

        const data = await res.json() as { results?: FdaResult[]; meta?: { results?: { total?: number } } };
        const total = data.meta?.results?.total ?? 0;
        const results = data.results ?? [];

        const reactionCounts = new Map<string, number>();
        for (const report of results) {
          for (const reaction of report.patient?.reaction ?? []) {
            if (reaction.reactionmeddrapt) {
              const key = reaction.reactionmeddrapt;
              reactionCounts.set(key, (reactionCounts.get(key) ?? 0) + 1);
            }
          }
        }

        const topReactions = [...reactionCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([name, count]) => `${name} (${count}건)`)
          .join(', ');

        if (total === 0 && !topReactions) throw new Error('No data');

        const rawContent =
          `원료: ${ingredient}\n` +
          `FDA 부작용 보고 총 건수: ${total.toLocaleString()}건\n` +
          (topReactions ? `주요 보고 부작용: ${topReactions}` : '');

        const summary = await this.aiProvider.generateText(
          `다음 FDA 부작용 보고 데이터를 건강기능식품 배합 연구원 관점에서 한국어로 요약해주세요.\n` +
          `어떤 부작용이 자주 나타나는지, 배합 시 주의할 점을 중심으로.\n\n${rawContent}`,
        );
        const embedding = await this.aiProvider.generateEmbedding(summary);

        const doc = await this.prisma.knowledgeDocument.create({
          data: {
            title: `${ingredient} 부작용 보고 (OpenFDA)`,
            sourceName: 'OpenFDA (미 FDA)',
            sourceUrl: `https://open.fda.gov/apis/drug/event/`,
            fileType: 'openfda',
            summary,
          },
        });

        await this.saveVectorDocument(doc.id, summary, { title: doc.title, sourceName: 'OpenFDA' }, embedding);
        await this.prisma.collectedUrl.create({ data: { url: searchUrl, source: 'OpenFDA' } });
        await delay(500);
      } catch (err) {
        this.logger.warn(`OpenFDA failed for "${ingredient}": ${String(err)}`);
      }

      await this.incrementDone(jobId);
    }
  }

  // ─── MFDS (키 있을 때만) ─────────────────────────────────────────────

  private async runMfdsCollection(jobId: string, apiKey: string) {
    const url = `${MFDS_BASE_URL}/${apiKey}/${MFDS_INGREDIENT_ENDPOINT}`;
    if (await this.prisma.collectedUrl.findUnique({ where: { url } })) {
      await this.incrementDone(jobId);
      return;
    }

    await this.updateJobMessage(jobId, '식약처 데이터 수집 중...');

    const res = await fetch(url);
    const data = await res.json() as { I0030?: { row?: Array<{ PRDLST_NM?: string; MAIN_INGR?: string }> } };
    const rows = data.I0030?.row ?? [];

    for (const row of rows) {
      if (!row.PRDLST_NM) continue;
      const text = `제품명: ${row.PRDLST_NM}\n주요 원료: ${row.MAIN_INGR ?? '정보 없음'}`;
      const summary = await this.aiProvider.generateText(
        `건강기능식품 배합 정보를 한국어로 요약해주세요:\n${text}`,
      );
      const embedding = await this.aiProvider.generateEmbedding(summary);

      const doc = await this.prisma.knowledgeDocument.create({
        data: {
          title: row.PRDLST_NM.substring(0, 200),
          sourceName: '식약처 건강기능식품 기준규격',
          fileType: 'mfds',
          summary,
        },
      });

      await this.saveVectorDocument(doc.id, summary, { title: doc.title, sourceName: '식약처' }, embedding);
    }

    await this.prisma.collectedUrl.create({ data: { url, source: 'MFDS' } });
    await this.incrementDone(jobId);
  }

  // ─── helpers ─────────────────────────────────────────────────────────

  private async saveVectorDocument(
    entityId: string,
    content: string,
    metadata: Record<string, string>,
    embedding: number[],
  ) {
    const embeddingString = `[${embedding.join(',')}]`;
    await this.prisma.$executeRaw`
      INSERT INTO "VectorDocument" (id, "entityType", "entityId", content, metadata, embedding, "createdAt", "updatedAt")
      VALUES (
        gen_random_uuid()::text,
        'KnowledgeDocument',
        ${entityId},
        ${content},
        ${JSON.stringify(metadata)}::jsonb,
        ${embeddingString}::vector,
        NOW(),
        NOW()
      )
    `;
  }

  private async incrementDone(jobId: string) {
    await this.prisma.collectionJob.update({
      where: { id: jobId },
      data: { doneCount: { increment: 1 } },
    });
  }

  private async updateJobMessage(jobId: string, message: string) {
    await this.prisma.collectionJob.update({
      where: { id: jobId },
      data: { message },
    });
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
