import { EvidenceService } from './evidence.service';
import { ImportJobsService } from './import-jobs.service';
import { PrismaService } from '../prisma/prisma.service';

describe('Evidence services', () => {
  const prisma = {
    evidenceSource: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    evidenceItem: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    evidenceLink: {
      create: jest.fn(),
    },
    dataImportJob: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;

  let evidenceService: EvidenceService;
  let importJobsService: ImportJobsService;

  beforeEach(() => {
    jest.clearAllMocks();
    evidenceService = new EvidenceService(prisma);
    importJobsService = new ImportJobsService(prisma);
  });

  it('registers evidence sources and evidence items for reuse', async () => {
    const source = { id: 'source-1', name: 'MFDS', type: 'open_api' };
    const item = { id: 'item-1', sourceId: 'source-1', title: '감초 기준' };
    prisma.evidenceSource.create.mockResolvedValue(source);
    prisma.evidenceItem.create.mockResolvedValue(item);

    await evidenceService.createSource({
      name: 'MFDS',
      type: 'open_api',
      baseUrl: 'https://example.test',
    });
    const result = await evidenceService.createItem({
      sourceId: 'source-1',
      title: '감초 기준',
      summary: '일일 섭취량 기준',
      rawText: 'raw text',
      sourceUrl: 'https://example.test/item',
      grade: 'official',
    });

    expect(result).toBe(item);
    expect(prisma.evidenceSource.create).toHaveBeenCalledWith({
      data: {
        name: 'MFDS',
        type: 'open_api',
        baseUrl: 'https://example.test',
      },
    });
    expect(prisma.evidenceItem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sourceId: 'source-1',
          title: '감초 기준',
          grade: 'official',
        }),
        include: expect.any(Object),
      }),
    );
  });

  it('stores raw external records and tracks normalization status', async () => {
    const importJob = { id: 'job-1', sourceName: 'MFDS OpenAPI' };
    prisma.dataImportJob.create.mockResolvedValue(importJob);

    const result = await importJobsService.createImportJob({
      sourceName: 'MFDS OpenAPI',
      status: 'IMPORTED',
      records: [
        {
          externalId: 'MFDS-001',
          sourceUrl: 'https://example.test/raw/1',
          rawPayload: {
            ingredient: '감초',
            limit: 'daily',
          },
        },
      ],
    });

    expect(result).toBe(importJob);
    expect(prisma.dataImportJob.create).toHaveBeenCalledWith({
      data: {
        sourceName: 'MFDS OpenAPI',
        status: 'IMPORTED',
        message: undefined,
        rawRecords: {
          create: [
            {
              sourceName: 'MFDS OpenAPI',
              externalId: 'MFDS-001',
              sourceUrl: 'https://example.test/raw/1',
              rawPayload: {
                ingredient: '감초',
                limit: 'daily',
              },
              normalizedStatus: 'PENDING',
            },
          ],
        },
      },
      include: {
        rawRecords: true,
      },
    });
  });

  it('lists import jobs with their raw records for status tracking', async () => {
    const importJobs = [
      {
        id: 'job-1',
        sourceName: 'MFDS OpenAPI',
        status: 'IMPORTED',
        rawRecords: [
          {
            id: 'record-1',
            normalizedStatus: 'PENDING',
          },
        ],
      },
    ];
    prisma.dataImportJob.findMany.mockResolvedValue(importJobs);

    const result = await importJobsService.findImportJobs();

    expect(result).toBe(importJobs);
    expect(prisma.dataImportJob.findMany).toHaveBeenCalledWith({
      orderBy: {
        startedAt: 'desc',
      },
      include: {
        rawRecords: true,
      },
      take: 20,
    });
  });
});
