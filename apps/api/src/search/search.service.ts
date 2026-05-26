import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AI_PROVIDER_TOKEN, type AiProvider } from '../ai/ai-provider.interface';

type SearchMatchType = 'vector' | 'structured';

export type SearchResult = {
  id: string;
  title: string;
  summary?: string | null;
  source: string;
  sourceUrl?: string | null;
  grade: string;
  matchType: SearchMatchType;
  distance?: number;
};

@Injectable()
export class SearchService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: AiProvider,
  ) {}

  async search(query: string) {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return {
        query,
        results: [],
      };
    }

    // 1. Generate query embedding
    const queryEmbedding = await this.aiProvider.generateEmbedding(normalizedQuery);
    const embeddingString = `[${queryEmbedding.join(',')}]`;

    // 2. Perform vector search using cosine distance (<=>)
    const vectorResults = await this.prisma.$queryRaw<
      { 
        id: string; 
        entityId: string; 
        content: string; 
        distance: number; 
        title?: string;
        source?: string;
      }[]
    >`
      SELECT 
        v.id, 
        v."entityId", 
        v.content, 
        (v.embedding <=> ${embeddingString}::vector) as distance,
        v.metadata->>'title' as title,
        v.metadata->>'source' as source
      FROM "VectorDocument" v
      ORDER BY distance ASC
      LIMIT 10;
    `;

    // 3. Map results
    const results: SearchResult[] = vectorResults.map((v) => ({
      id: v.entityId || v.id,
      title: v.title || 'Unknown Document',
      summary: v.content.substring(0, 200),
      source: v.source || 'Vector DB',
      sourceUrl: null,
      grade: 'internal',
      matchType: 'vector',
      distance: v.distance,
    }));

    return {
      query: normalizedQuery,
      results,
    };
  }
}
