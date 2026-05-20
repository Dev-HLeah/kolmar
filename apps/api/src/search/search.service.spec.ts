import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SearchService', () => {
  const prisma = {
    evidenceItem: {
      findMany: jest.fn(),
    },
  } as unknown as jest.Mocked<PrismaService>;

  let service: SearchService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SearchService(prisma);
  });

  it('returns structured evidence search results first', async () => {
    prisma.evidenceItem.findMany.mockResolvedValue([
      {
        id: 'evidence-1',
        title: '감초 배합 기준',
        summary: '일일 섭취량 기준',
        sourceUrl: 'https://example.test',
        grade: 'official',
        source: { name: 'MFDS' },
      },
    ]);

    const result = await service.search('감초');

    expect(result.results).toEqual([
      {
        id: 'evidence-1',
        title: '감초 배합 기준',
        summary: '일일 섭취량 기준',
        source: 'MFDS',
        sourceUrl: 'https://example.test',
        grade: 'official',
        matchType: 'structured',
      },
    ]);
  });

  it('returns mock vector results when no structured data is available', async () => {
    prisma.evidenceItem.findMany.mockResolvedValue([]);

    const result = await service.search('비타민C 산미');

    expect(result.results).toEqual([
      expect.objectContaining({
        id: 'mock-vector-1',
        matchType: 'mock-vector',
      }),
    ]);
  });
});
