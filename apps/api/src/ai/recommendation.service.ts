import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER_TOKEN } from './ai-provider.interface';
import type { AiProvider } from './ai-provider.interface';
import { CreateDraftTriesDto } from './dto/create-draft-tries.dto';

type DraftTryCandidate = {
  title: string;
  objective: string;
  suggestedChanges: string[];
  riskChecks: string[];
};

@Injectable()
export class RecommendationService {
  constructor(
    @Inject(AI_PROVIDER_TOKEN) private readonly aiProvider: AiProvider,
  ) {}

  async createDraftTries(dto: CreateDraftTriesDto) {
    const prompt = this.buildPrompt(dto);
    const providerOutput = await this.aiProvider.generateText(prompt);

    return {
      projectName: dto.projectName ?? '신규 제품 개발',
      providerOutput,
      safetyNotice:
        'AI 추천은 연구 후보 초안이며, 독성/상한/규격/공정 적합성은 근거 자료와 실험으로 확인해야 합니다.',
      candidates: this.createCandidateSet(dto),
    };
  }

  private buildPrompt(dto: CreateDraftTriesDto) {
    return [
      '건강기능식품 고형제 배합 후보를 제안한다.',
      '독성 가능성을 최우선으로 회피하고, 기준 규격과 상한 섭취량을 위반할 수 있는 변경은 명확히 경고한다.',
      '콜마 특화 제형 가능성도 함께 검토한다.',
      JSON.stringify(dto, null, 2),
    ].join('\n');
  }

  private createCandidateSet(dto: CreateDraftTriesDto): DraftTryCandidate[] {
    const targetFunction = dto.targetFunction ?? '목표 기능성';
    const dosageForm = dto.dosageForm ?? '고형제';

    return [
      {
        title: '안정성 우선 후보',
        objective: '원료 상한, 독성 가능성, 부적합 배합을 우선 회피',
        suggestedChanges: ['고위험 원료 증량 보류', '기준 처방 대비 최소 변경'],
        riskChecks: ['식약처 기준 규격', '원료별 일일 섭취량 상한'],
      },
      {
        title: '기능성 우선 후보',
        objective: `${targetFunction} 지표 강화를 목표로 한 후보`,
        suggestedChanges: [
          '핵심 기능 원료 비율 검토',
          '근거 등급 높은 원료 우선',
        ],
        riskChecks: ['기능성 인정 범위', '원료 간 상호작용'],
      },
      {
        title: '맛/관능 개선 후보',
        objective: '쓴맛, 산미, 색 변화를 줄이는 후보',
        suggestedChanges: ['관능 이슈 원료 비율 완화', '마스킹 원료 후보 검토'],
        riskChecks: ['당류/감미료 기준', '제형별 맛 안정성'],
      },
      {
        title: '원가 절감 후보',
        objective: '핵심 기능을 유지하면서 고가 원료 사용량을 낮추는 후보',
        suggestedChanges: [
          '고가 원료 단계적 감량',
          '동일 기능 근거 원료 대체 검토',
        ],
        riskChecks: ['기능성 저하', '원료 대체 시 표시 기준'],
      },
      {
        title: '콜마 특화 제형 후보',
        objective: `${dosageForm} 기반 콜마 특화 고형제 옵션을 검토`,
        suggestedChanges: [
          '츄어블/이중 제형/미니 정제 적용성 검토',
          '스틱 또는 Multi PTP 포장 검토',
        ],
        riskChecks: ['제형 안정성', '공정 변경에 따른 품질 기준'],
      },
      {
        title: '기존 처방 최소 변경 후보',
        objective: '현재 처방을 최대한 유지하고 테스트 리스크를 낮추는 후보',
        suggestedChanges: ['기준 처방 유지', '한 번에 하나의 변수만 변경'],
        riskChecks: ['변경 원료 영향 추적', 'try 간 비교 가능성'],
      },
    ];
  }
}
