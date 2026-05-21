import { RecommendationService } from './recommendation.service';
import type { AiProvider } from './ai-provider.interface';

describe('RecommendationService', () => {
  it('creates six draft try candidates with safety-first instructions', async () => {
    const generateText = jest.fn().mockResolvedValue('mock provider output');
    const provider: AiProvider = {
      generateText,
    };
    const service = new RecommendationService(provider);

    const result = await service.createDraftTries({
      projectName: '신물 억제 고형제 개발',
      targetFunction: '신물 억제',
      dosageForm: '츄어블 정제',
      sourceFormula: {
        ingredients: [
          { ingredientName: '비타민 C', amount: '500', unit: 'mg' },
          { ingredientName: '아연', amount: '8', unit: 'mg' },
        ],
      },
      evidenceContext: ['식약처 기준 우선 확인'],
    });

    expect(generateText).toHaveBeenCalledWith(
      expect.stringContaining('독성 가능성을 최우선으로 회피'),
    );
    expect(result.providerOutput).toBe('mock provider output');
    expect(result.candidates).toHaveLength(6);
    expect(result.candidates.map((candidate) => candidate.title)).toContain(
      '콜마 특화 제형 후보',
    );
  });

  it('adds review-only safety signals from source formula inputs', async () => {
    const generateText = jest.fn().mockResolvedValue('mock provider output');
    const provider: AiProvider = {
      generateText,
    };
    const service = new RecommendationService(provider);

    const result = await service.createDraftTries({
      sourceFormula: {
        ingredients: [
          {
            ingredientName: '비타민 C',
            amount: '500',
            unit: 'mg',
            note: '산미 조절',
          },
          { ingredientName: '아연', amount: '45', unit: 'mg' },
        ],
      },
    });

    expect(result.safetySignals).toEqual([
      expect.objectContaining({
        label: '관능/산미 안정성',
        severity: 'caution',
        relatedIngredients: ['비타민 C'],
      }),
      expect.objectContaining({
        label: '상한 섭취량 검토',
        severity: 'warning',
        relatedIngredients: ['아연'],
      }),
      expect.objectContaining({
        label: '원료 조합 검토',
        severity: 'info',
        relatedIngredients: ['비타민 C', '아연'],
      }),
    ]);
    expect(
      result.safetySignals.map((signal) => signal.message).join(' '),
    ).toContain('검토');
    expect(
      result.safetySignals.map((signal) => signal.message).join(' '),
    ).not.toContain('독성입니다');
  });
});
