import { Inject, Injectable, Logger } from '@nestjs/common';
import { AI_PROVIDER_TOKEN } from './ai-provider.interface';
import type { AiProvider } from './ai-provider.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDraftTriesDto } from './dto/create-draft-tries.dto';

type SafetySignal = {
  type: string;
  label: string;
  severity: 'warning' | 'caution' | 'info';
  message: string;
  evidenceLevel: string;
  relatedIngredients: string[];
};

@Injectable()
export class RecommendationService {
  private readonly logger = new Logger(RecommendationService.name);

  constructor(
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: AiProvider,
    private readonly prisma: PrismaService,
  ) {}

  async createDraftTries(dto: CreateDraftTriesDto) {
    const ingredientsString = (dto.sourceFormula?.ingredients ?? [])
      .map((i) => `${i.ingredientName} ${i.amount}${i.unit}`)
      .join(', ');

    // 1. RAG Search (Vector Search based on ingredients)
    let contextDocs = '';
    if (ingredientsString) {
      const queryEmbedding = await this.aiProvider.generateEmbedding(ingredientsString);
      const embeddingString = `[${queryEmbedding.join(',')}]`;
      
      const vectorResults = await this.prisma.$queryRaw<{ content: string; title: string }[]>`
        SELECT v.content, v.metadata->>'title' as title
        FROM "VectorDocument" v
        ORDER BY (v.embedding <=> ${embeddingString}::vector) ASC
        LIMIT 5;
      `;
      contextDocs = vectorResults.map((r, i) => `[문헌 ${i + 1}] ${r.title}: ${r.content}`).join('\n\n');
    }

    // 2. Build Prompt for LLM
    const prompt = this.buildPrompt(dto, contextDocs);
    const providerOutput = await this.aiProvider.generateText(prompt);

    // 3. Parse JSON response from LLM
    let safetySignals: SafetySignal[] = [];
    try {
      // Find json block if markdown formatted
      const jsonMatch = providerOutput.match(/```json\n([\s\S]*?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : providerOutput;
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.safetySignals)) {
        safetySignals = parsed.safetySignals;
      }
    } catch (e) {
      this.logger.error('Failed to parse AI JSON response', e);
      // Fallback
      safetySignals = [{
        type: 'parsing-error',
        label: '분석 실패',
        severity: 'info',
        message: 'AI 분석 결과를 파싱하는데 실패했습니다. 다시 시도해주세요.',
        evidenceLevel: 'system',
        relatedIngredients: []
      }];
    }

    return {
      projectName: dto.projectName ?? '신규 제품 개발',
      providerOutput: 'AI 배합 분석이 완료되었습니다.',
      safetyNotice: 'AI 추천은 연구 후보 초안이며, 독성/상한/규격/공정 적합성은 근거 자료와 실험으로 확인해야 합니다.',
      safetySignals: safetySignals,
      candidates: [], // Currently not focusing on candidate generation for this feature
    };
  }

  private buildPrompt(dto: CreateDraftTriesDto, contextDocs: string) {
    return `
당신은 건강기능식품 및 제약 배합을 분석하는 전문 AI 연구 보조원입니다.
다음은 사용자가 입력한 배합표와, 시스템이 검색한 근거 문헌(논문/식약처 자료 등)입니다.

[배합 데이터]
${JSON.stringify(dto, null, 2)}

[검색된 근거 문헌 (Context)]
${contextDocs || '검색된 근거 문헌이 없습니다.'}

위 배합 데이터를 분석하여 다음을 수행하세요:
1. 근거 문헌을 바탕으로 원료 간 상호작용, 부작용, 독성 발생 가능성을 경고하세요. (예: A원료가 B원료보다 배합비가 높을 때의 부작용 등)
2. 시중 유사 브랜드 제품과 배합을 벤치마킹하여 노티를 제공하세요. (근거 문헌에 없다면 자체 사전 지식 활용 가능)

반드시 아래 JSON 형식으로만 응답하세요. (마크다운 백틱 없이 순수 JSON만 출력)
{
  "safetySignals": [
    {
      "type": "상호작용|독성경고|유사제품|일반노티",
      "label": "짧은 경고 제목 (예: 관능/산미 안정성)",
      "severity": "warning" | "caution" | "info",
      "message": "상세한 경고 또는 분석 메시지",
      "evidenceLevel": "문헌 기반" | "사전 지식 기반",
      "relatedIngredients": ["원료명1", "원료명2"]
    }
  ]
}
`;
  }
}
