import { Inject, Injectable, Logger } from '@nestjs/common';
import { AI_PROVIDER_TOKEN } from './ai-provider.interface';
import type { AiProvider } from './ai-provider.interface';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDraftTriesDto, DraftFormulaIngredientDto } from './dto/create-draft-tries.dto';

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
    const ingredients = dto.sourceFormula?.ingredients ?? [];

    // RAG: 원료명 + 비율 포함해서 더 관련성 높은 문헌 검색
    let contextDocs = '';
    if (ingredients.length > 0) {
      const ragQuery = ingredients
        .map((i) => `${i.ingredientName} ${i.amount ?? ''}${i.unit ?? ''} ${i.ratio ? `(${i.ratio}%)` : ''}`)
        .join(', ');

      const queryEmbedding = await this.aiProvider.generateEmbedding(ragQuery);
      const embeddingString = `[${queryEmbedding.join(',')}]`;

      const vectorResults = await this.prisma.$queryRaw<{ content: string; title: string }[]>`
        SELECT v.content, v.metadata->>'title' as title
        FROM "VectorDocument" v
        ORDER BY (v.embedding <=> ${embeddingString}::vector) ASC
        LIMIT 5;
      `;
      contextDocs = vectorResults
        .map((r, i) => `[문헌 ${i + 1}] ${r.title ?? '제목 없음'}: ${r.content}`)
        .join('\n\n');
    }

    const prompt = this.buildPrompt(dto, contextDocs);
    const providerOutput = await this.aiProvider.generateText(prompt);

    let safetySignals: SafetySignal[] = [];
    try {
      const jsonMatch = providerOutput.match(/```json\n([\s\S]*?)\n```/) ??
                        providerOutput.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[1] ?? jsonMatch[0] : providerOutput;
      const parsed = JSON.parse(jsonString) as { safetySignals?: SafetySignal[] };
      if (Array.isArray(parsed.safetySignals)) {
        safetySignals = parsed.safetySignals;
      }
    } catch (e) {
      this.logger.error('Failed to parse AI JSON response', e);
      safetySignals = [{
        type: 'parsing-error',
        label: '분석 결과 파싱 실패',
        severity: 'info',
        message: 'AI 응답을 파싱하는 데 실패했습니다. 다시 시도해주세요.',
        evidenceLevel: 'system',
        relatedIngredients: [],
      }];
    }

    return {
      projectName: dto.projectName ?? '신규 제품 개발',
      providerOutput: 'AI 배합 분석이 완료됐습니다.',
      safetyNotice: 'AI 추천은 연구 후보 초안이며, 독성/상한/규격/공정 적합성은 근거 자료와 실험으로 확인해야 합니다.',
      safetySignals,
      candidates: [],
    };
  }

  private buildPrompt(dto: CreateDraftTriesDto, contextDocs: string) {
    const ingredients = dto.sourceFormula?.ingredients ?? [];
    const ingredientTable = buildIngredientTable(ingredients);
    const ratioPairs = buildRatioPairs(ingredients);
    const dominanceNote = buildDominanceNote(ingredients);

    return `
당신은 건강기능식품 및 제약 배합을 분석하는 전문 AI 연구 보조원입니다.

[제품 정보]
- 프로젝트명: ${dto.projectName ?? '미입력'}
- 개발 목표: ${dto.targetFunction ?? '미입력'}
- 제형: ${dto.dosageForm ?? '미입력'}

[원료 배합표]
${ingredientTable}

[원료 간 상대 비율 (A:B)]
${ratioPairs || '원료가 1개 이하이거나 비율 정보 없음'}

[배합비 우위 관계]
${dominanceNote || '비율 정보 없음'}

[검색된 근거 문헌]
${contextDocs || '검색된 근거 문헌이 없습니다.'}

위 배합 데이터를 분석하여 다음을 수행하세요:

1. **원료 간 상호작용**: 두 원료가 함께 배합될 때 발생할 수 있는 효능 상승/저해/독성 위험
2. **비율 의존성 분석**: 특정 원료가 다른 원료보다 배합비가 높거나 낮을 때 달라지는 안전성/효능 (예: A > B일 때 vs A < B일 때)
3. **절대 함량 위험**: 단일 원료의 함량이 안전 상한(UL)을 초과할 가능성
4. **유사 제품 벤치마크**: 이 배합과 유사한 시판 제품이 있다면 언급 (근거 문헌 우선, 없으면 사전 지식 활용)
5. **개선 제안**: 배합비 조정으로 안전성이나 효능을 높일 수 있는 방향

반드시 아래 JSON 형식으로만 응답하세요. (순수 JSON, 마크다운 없이)
{
  "safetySignals": [
    {
      "type": "상호작용|비율경고|함량초과|유사제품|개선제안",
      "label": "짧은 제목 (10자 이내)",
      "severity": "warning|caution|info",
      "message": "상세 분석 메시지 (어떤 비율 조건에서 어떤 문제가 발생하는지 구체적으로)",
      "evidenceLevel": "문헌 기반|사전 지식 기반",
      "relatedIngredients": ["원료명1", "원료명2"]
    }
  ]
}
`.trim();
  }
}

// ─── helpers ───────────────────────────────────────────────────────────────

function buildIngredientTable(ingredients: DraftFormulaIngredientDto[]): string {
  if (!ingredients.length) return '원료 없음';

  const header = '원료명               | 함량       | 단위 | 비율(%)';
  const sep    = '-------------------- | ---------- | ---- | -------';
  const rows = ingredients.map((i) => {
    const name   = (i.ingredientName ?? '').padEnd(20);
    const amount = String(i.amount ?? '-').padEnd(10);
    const unit   = String(i.unit ?? '-').padEnd(4);
    const ratio  = i.ratio != null ? `${i.ratio}%` : '-';
    return `${name} | ${amount} | ${unit} | ${ratio}`;
  });

  return [header, sep, ...rows].join('\n');
}

function buildRatioPairs(ingredients: DraftFormulaIngredientDto[]): string {
  const withRatio = ingredients.filter(
    (i) => i.ingredientName && i.ratio != null && Number(i.ratio) > 0,
  );
  if (withRatio.length < 2) return '';

  const lines: string[] = [];
  for (let a = 0; a < withRatio.length; a++) {
    for (let b = a + 1; b < withRatio.length; b++) {
      const ia = withRatio[a];
      const ib = withRatio[b];
      const ra = Number(ia.ratio);
      const rb = Number(ib.ratio);
      if (!ra || !rb) continue;

      const ratio = (ra / rb).toFixed(2);
      const dominant = ra > rb ? ia.ingredientName : ib.ingredientName;
      lines.push(
        `${ia.ingredientName} : ${ib.ingredientName} = ${ratio} : 1  (${dominant} 우위)`,
      );
    }
  }
  return lines.join('\n');
}

function buildDominanceNote(ingredients: DraftFormulaIngredientDto[]): string {
  const withRatio = ingredients
    .filter((i) => i.ingredientName && i.ratio != null && Number(i.ratio) > 0)
    .sort((a, b) => Number(b.ratio) - Number(a.ratio));

  if (!withRatio.length) return '';

  return withRatio
    .map((i, idx) => `${idx + 1}위: ${i.ingredientName} (${i.ratio}%)`)
    .join(', ');
}
