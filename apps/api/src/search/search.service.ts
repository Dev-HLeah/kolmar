import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type SearchMatchType = 'structured' | 'mock-vector';

type SearchResult = {
  id: string;
  title: string;
  summary?: string | null;
  source: string;
  sourceUrl?: string | null;
  grade: string;
  matchType: SearchMatchType;
};

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: string) {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return {
        query,
        results: [],
      };
    }

    const structuredResults =
      await this.searchStructuredEvidence(normalizedQuery);

    return {
      query: normalizedQuery,
      results:
        structuredResults.length > 0
          ? structuredResults
          : this.searchMockVector(normalizedQuery),
    };
  }

  private async searchStructuredEvidence(
    query: string,
  ): Promise<SearchResult[]> {
    const items = await this.prisma.evidenceItem.findMany({
      where: {
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            summary: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            rawText: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        source: true,
      },
    });

    return items.map((item) => ({
      id: item.id,
      title: item.title,
      summary: item.summary,
      source: item.source.name,
      sourceUrl: item.sourceUrl,
      grade: item.grade,
      matchType: 'structured',
    }));
  }

  private searchMockVector(query: string): SearchResult[] {
    return [
      {
        id: 'mock-vector-1',
        title: `${query} 관련 근거 후보`,
        summary:
          'Supabase pgvector 연결 전 개발용 mock 결과입니다. 실제 연결 후 EvidenceItem/VectorDocument 기반 유사도 검색으로 교체합니다.',
        source: 'mock-vector',
        sourceUrl: null,
        grade: 'mock',
        matchType: 'mock-vector',
      },
    ];
  }
}
